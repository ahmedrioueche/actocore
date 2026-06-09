import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type {
  AccountUsageSummaryData,
  ChatIntent,
  PlatformUsageOverviewData,
  ProjectKnowledgeUsageData,
  ProjectSessionUsageData,
  TokenUsageData,
  UsageDailyBucket,
  UsageEventData,
  ProjectUsageBreakdownData,
  UsageEventsPageData,
  UsageProviderBreakdownRow,
  UsageSummaryData,
  UsageTimeSeriesData,
} from '@ahmedrioueche/actocore-shared';
import { Model } from 'mongoose';
import { withProjectId } from '../common/tenant/tenant-scope';
import {
  KnowledgeChunk,
  KnowledgeChunkDocument,
} from '../knowledge/schemas/knowledge-chunk.schema';
import {
  KnowledgeSource,
  KnowledgeSourceDocument,
} from '../knowledge/schemas/knowledge-source.schema';
import type { LlmResolvedConfig } from '../config/llm.config';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { ProjectsService } from '../projects/projects.service';
import {
  StudioAccount,
  StudioAccountDocument,
} from '../studio/schemas/studio-account.schema';
import { StudioPlatformBootstrapService } from '../studio/studio-platform-bootstrap.service';
import {
  ChatMessage,
  ChatMessageDocument,
} from '../sessions/schemas/chat-message.schema';
import {
  ChatSession,
  ChatSessionDocument,
} from '../sessions/schemas/chat-session.schema';
import { StudioRole } from '@ahmedrioueche/actocore-shared';
import type { StudioRequestContext } from '../studio/studio-context';
import { UsageEvent, UsageEventDocument } from './schemas/usage-event.schema';
import {
  estimateTokensFromText,
  usageEventsToCsv,
} from './utils/usage-export.util';
import {
  buildCreatedAtFilter,
  defaultSeriesRange,
  parseUsageRangeQuery,
} from './utils/usage-range.util';
import { percentile } from './utils/percentile.util';

const EXPORT_MAX_ROWS = 10_000;

export interface RecordChatUsageInput {
  projectId: string;
  apiKeyId?: string;
  intent: ChatIntent;
  llmProvider?: string;
  usage?: TokenUsageData;
  latencyMs?: number;
  success?: boolean;
  errorCode?: string;
}

const PLATFORM_USAGE_TOP_N = 10;

@Injectable()
export class UsageService {
  constructor(
    private readonly configService: ConfigService,
    private readonly bootstrap: StudioPlatformBootstrapService,
    @InjectModel(UsageEvent.name)
    private readonly usageModel: Model<UsageEventDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(StudioAccount.name)
    private readonly accountModel: Model<StudioAccountDocument>,
    @InjectModel(KnowledgeSource.name)
    private readonly knowledgeSourceModel: Model<KnowledgeSourceDocument>,
    @InjectModel(KnowledgeChunk.name)
    private readonly knowledgeChunkModel: Model<KnowledgeChunkDocument>,
    @InjectModel(ChatSession.name)
    private readonly chatSessionModel: Model<ChatSessionDocument>,
    @InjectModel(ChatMessage.name)
    private readonly chatMessageModel: Model<ChatMessageDocument>,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projects: ProjectsService,
  ) {}

  async recordChatUsage(input: RecordChatUsageInput): Promise<void> {
    await this.usageModel.create({
      projectId: input.projectId,
      route: 'sdk/chat',
      intent: input.intent,
      llmProvider: input.llmProvider,
      llmModel: input.usage?.model,
      promptTokens: input.usage?.promptTokens,
      completionTokens: input.usage?.completionTokens,
      apiKeyId: input.apiKeyId,
      latencyMs: input.latencyMs,
      success: input.success ?? true,
      errorCode: input.errorCode,
    });
  }

  async getProjectBreakdown(
    projectId: string,
    fromRaw?: string,
    toRaw?: string,
  ): Promise<ProjectUsageBreakdownData> {
    await this.projects.assertExists(projectId);
    const range = parseUsageRangeQuery(fromRaw, toRaw);
    const events = await this.usageModel
      .find({
        ...withProjectId(projectId),
        ...buildCreatedAtFilter(range),
      })
      .select({ route: 1, latencyMs: 1, success: 1 })
      .exec();

    const byRoute = new Map<
      string,
      { requests: number; errors: number; latencies: number[] }
    >();

    for (const event of events) {
      const route = event.route ?? 'unknown';
      const row = byRoute.get(route) ?? {
        requests: 0,
        errors: 0,
        latencies: [],
      };
      row.requests += 1;
      if (event.success === false) {
        row.errors += 1;
      }
      if (event.latencyMs != null && event.latencyMs >= 0) {
        row.latencies.push(event.latencyMs);
      }
      byRoute.set(route, row);
    }

    const allLatencies: number[] = [];
    let totalRequests = 0;
    let totalErrors = 0;

    const routeRows = [...byRoute.entries()].map(([route, row]) => {
      totalRequests += row.requests;
      totalErrors += row.errors;
      allLatencies.push(...row.latencies);
      return {
        route,
        requests: row.requests,
        errors: row.errors,
        errorRate: row.requests > 0 ? row.errors / row.requests : 0,
        p95LatencyMs: percentile(row.latencies, 0.95),
      };
    });

    routeRows.sort((a, b) => b.requests - a.requests);

    return {
      projectId,
      from: range.from?.toISOString(),
      to: range.to?.toISOString(),
      totalRequests,
      totalErrors,
      errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
      p95LatencyMs: percentile(allLatencies, 0.95),
      byRoute: routeRows,
    };
  }

  async sumChatTokensThisMonthForAccount(
    accountId: string,
    projectIds: string[],
  ): Promise<number> {
    if (projectIds.length === 0) {
      return 0;
    }
    return this.aggregateChatTokensThisMonth({ projectId: { $in: projectIds } });
  }

  async sumChatTokensThisMonth(projectId: string): Promise<number> {
    return this.aggregateChatTokensThisMonth(withProjectId(projectId));
  }

  private async aggregateChatTokensThisMonth(
    projectFilter: Record<string, unknown>,
  ): Promise<number> {
    const startOfMonth = this.startOfUtcMonth();
    const rows = await this.usageModel
      .aggregate<{ total: number }>([
        {
          $match: {
            ...projectFilter,
            route: 'sdk/chat',
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $add: [
                  { $ifNull: ['$promptTokens', 0] },
                  { $ifNull: ['$completionTokens', 0] },
                ],
              },
            },
          },
        },
      ])
      .exec();

    return rows[0]?.total ?? 0;
  }

  async getProjectSummary(
    projectId: string,
    fromRaw?: string,
    toRaw?: string,
  ): Promise<UsageSummaryData> {
    await this.projects.assertExists(projectId);
    const range = parseUsageRangeQuery(fromRaw, toRaw);

    const events = await this.usageModel
      .find({
        ...withProjectId(projectId),
        ...buildCreatedAtFilter(range),
      })
      .exec();

    const aggregated = this.aggregateEvents(events);
    return {
      projectId,
      ...aggregated,
      from: range.from?.toISOString(),
      to: range.to?.toISOString(),
    };
  }

  async getProjectTimeSeries(
    projectId: string,
    fromRaw?: string,
    toRaw?: string,
  ): Promise<UsageTimeSeriesData> {
    await this.projects.assertExists(projectId);
    const parsed = parseUsageRangeQuery(fromRaw, toRaw);
    const { from, to } =
      parsed.from || parsed.to
        ? { from: parsed.from ?? new Date(0), to: parsed.to ?? new Date() }
        : defaultSeriesRange();

    const buckets = await this.usageModel
      .aggregate<{
        _id: string;
        requests: number;
        promptTokens: number;
        completionTokens: number;
      }>([
        {
          $match: {
            projectId,
            ...buildCreatedAtFilter({ from, to }),
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' },
            },
            requests: { $sum: 1 },
            promptTokens: { $sum: { $ifNull: ['$promptTokens', 0] } },
            completionTokens: { $sum: { $ifNull: ['$completionTokens', 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();

    return {
      projectId,
      from: from.toISOString(),
      to: to.toISOString(),
      granularity: 'day',
      buckets: buckets.map(
        (row): UsageDailyBucket => ({
          date: row._id,
          requests: row.requests,
          promptTokens: row.promptTokens,
          completionTokens: row.completionTokens,
        }),
      ),
    };
  }

  async listProjectEvents(
    projectId: string,
    options: {
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
      redactApiKeys?: boolean;
    },
  ): Promise<UsageEventsPageData> {
    await this.projects.assertExists(projectId);
    const range = parseUsageRangeQuery(options.from, options.to);
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 25));
    const skip = (page - 1) * limit;

    const filter = {
      ...withProjectId(projectId),
      ...buildCreatedAtFilter(range),
    };

    const [rows, total] = await Promise.all([
      this.usageModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.usageModel.countDocuments(filter).exec(),
    ]);

    return {
      projectId,
      page,
      limit,
      total,
      items: rows.map((row) => this.toEventData(row, options.redactApiKeys)),
    };
  }

  async getPlatformUsageOverview(
    fromRaw?: string,
    toRaw?: string,
  ): Promise<PlatformUsageOverviewData> {
    const parsed = parseUsageRangeQuery(fromRaw, toRaw);
    const { from, to } =
      parsed.from || parsed.to
        ? { from: parsed.from ?? new Date(0), to: parsed.to ?? new Date() }
        : defaultSeriesRange();

    const llm = this.configService.getOrThrow<LlmResolvedConfig>('llm');
    const platformAccountId = this.bootstrap.getPlatformAccountId();
    const tenantProjectFilter = platformAccountId
      ? { accountId: { $ne: platformAccountId } }
      : {};

    const projects = await this.projectModel
      .find(tenantProjectFilter)
      .select({ _id: 1, name: 1, accountId: 1 })
      .exec();

    const projectIds = projects.map((project) => project._id.toString());
    const projectById = new Map(
      projects.map((project) => [
        project._id.toString(),
        {
          name: project.name,
          accountId: project.accountId,
        },
      ]),
    );

    if (projectIds.length === 0) {
      return this.emptyPlatformUsageOverview(from, to, llm.provider);
    }

    const events = await this.usageModel
      .find({
        projectId: { $in: projectIds },
        ...buildCreatedAtFilter({ from, to }),
      })
      .select({
        projectId: 1,
        llmProvider: 1,
        llmModel: 1,
        intent: 1,
        promptTokens: 1,
        completionTokens: 1,
        success: 1,
        latencyMs: 1,
        createdAt: 1,
      })
      .exec();

    const byProvider: Record<string, UsageProviderBreakdownRow> = {};
    const byModel: Record<string, number> = {};
    const byIntent: Record<string, number> = {};
    const bucketMap = new Map<string, UsageDailyBucket>();
    const perProject = new Map<
      string,
      { requests: number; prompt: number; completion: number }
    >();
    const perAccount = new Map<
      string,
      { requests: number; prompt: number; completion: number }
    >();

    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalErrors = 0;
    const latencies: number[] = [];

    for (const event of events) {
      const promptTokens = event.promptTokens ?? 0;
      const completionTokens = event.completionTokens ?? 0;
      totalPromptTokens += promptTokens;
      totalCompletionTokens += completionTokens;

      if (event.success === false) {
        totalErrors += 1;
      }
      if (event.latencyMs != null && event.latencyMs >= 0) {
        latencies.push(event.latencyMs);
      }

      const provider = event.llmProvider ?? 'unknown';
      const providerRow = byProvider[provider] ?? {
        requests: 0,
        promptTokens: 0,
        completionTokens: 0,
      };
      providerRow.requests += 1;
      providerRow.promptTokens += promptTokens;
      providerRow.completionTokens += completionTokens;
      byProvider[provider] = providerRow;

      const model = event.llmModel ?? 'unknown';
      byModel[model] = (byModel[model] ?? 0) + 1;

      const intent = event.intent ?? 'unknown';
      byIntent[intent] = (byIntent[intent] ?? 0) + 1;

      const date = (event.createdAt ?? new Date()).toISOString().slice(0, 10);
      const bucket = bucketMap.get(date) ?? {
        date,
        requests: 0,
        promptTokens: 0,
        completionTokens: 0,
      };
      bucket.requests += 1;
      bucket.promptTokens += promptTokens;
      bucket.completionTokens += completionTokens;
      bucketMap.set(date, bucket);

      const projectStats = perProject.get(event.projectId) ?? {
        requests: 0,
        prompt: 0,
        completion: 0,
      };
      projectStats.requests += 1;
      projectStats.prompt += promptTokens;
      projectStats.completion += completionTokens;
      perProject.set(event.projectId, projectStats);

      const projectMeta = projectById.get(event.projectId);
      if (projectMeta) {
        const accountStats = perAccount.get(projectMeta.accountId) ?? {
          requests: 0,
          prompt: 0,
          completion: 0,
        };
        accountStats.requests += 1;
        accountStats.prompt += promptTokens;
        accountStats.completion += completionTokens;
        perAccount.set(projectMeta.accountId, accountStats);
      }
    }

    const accountIds = [...perAccount.keys()];
    const accounts = accountIds.length
      ? await this.accountModel
          .find({ _id: { $in: accountIds } })
          .select({ _id: 1, name: 1 })
          .exec()
      : [];
    const accountNameById = new Map(
      accounts.map((account) => [account._id.toString(), account.name]),
    );

    const totalRequests = events.length;

    const topProjects = [...perProject.entries()]
      .map(([projectId, stats]) => {
        const meta = projectById.get(projectId);
        const accountId = meta?.accountId ?? '';
        return {
          projectId,
          projectName: meta?.name ?? projectId,
          accountId,
          accountName: accountNameById.get(accountId) ?? accountId,
          totalRequests: stats.requests,
          totalPromptTokens: stats.prompt,
          totalCompletionTokens: stats.completion,
        };
      })
      .sort((a, b) => b.totalRequests - a.totalRequests)
      .slice(0, PLATFORM_USAGE_TOP_N);

    const topAccounts = [...perAccount.entries()]
      .map(([accountId, stats]) => ({
        accountId,
        accountName: accountNameById.get(accountId) ?? accountId,
        totalRequests: stats.requests,
        totalPromptTokens: stats.prompt,
        totalCompletionTokens: stats.completion,
      }))
      .sort((a, b) => b.totalRequests - a.totalRequests)
      .slice(0, PLATFORM_USAGE_TOP_N);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      configuredProvider: llm.provider,
      totalRequests,
      totalPromptTokens,
      totalCompletionTokens,
      totalErrors,
      errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
      p95LatencyMs: percentile(latencies, 0.95),
      byProvider,
      byModel,
      byIntent,
      buckets: [...bucketMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
      topAccounts,
      topProjects,
    };
  }

  async getAccountSummaryForPlatform(
    accountId: string,
    fromRaw?: string,
    toRaw?: string,
  ): Promise<AccountUsageSummaryData> {
    const ctx: StudioRequestContext = {
      accountId,
      userId: 'platform',
      email: 'platform@actocore.internal',
      role: StudioRole.SUPER_ADMIN,
      permissions: [],
      projectIds: [],
    };
    return this.getAccountSummary(ctx, fromRaw, toRaw);
  }

  async getAccountSummary(
    ctx: StudioRequestContext,
    fromRaw?: string,
    toRaw?: string,
  ): Promise<AccountUsageSummaryData> {
    const range = parseUsageRangeQuery(fromRaw, toRaw);
    const projectList = await this.projects.list(ctx, { limit: 200 });
    const projectIds = projectList.map((p) => p.id);

    if (projectIds.length === 0) {
      return {
        accountId: ctx.accountId,
        from: range.from?.toISOString(),
        to: range.to?.toISOString(),
        totalRequests: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        byIntent: {},
        projects: [],
      };
    }

    const events = await this.usageModel
      .find({
        projectId: { $in: projectIds },
        ...buildCreatedAtFilter(range),
      })
      .exec();

    const byIntent: Record<string, number> = {};
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    const perProject = new Map<
      string,
      { requests: number; prompt: number; completion: number }
    >();

    for (const event of events) {
      const intent = event.intent ?? 'unknown';
      byIntent[intent] = (byIntent[intent] ?? 0) + 1;
      totalPromptTokens += event.promptTokens ?? 0;
      totalCompletionTokens += event.completionTokens ?? 0;

      const row = perProject.get(event.projectId) ?? {
        requests: 0,
        prompt: 0,
        completion: 0,
      };
      row.requests += 1;
      row.prompt += event.promptTokens ?? 0;
      row.completion += event.completionTokens ?? 0;
      perProject.set(event.projectId, row);
    }

    const nameById = new Map(projectList.map((p) => [p.id, p.name]));

    return {
      accountId: ctx.accountId,
      from: range.from?.toISOString(),
      to: range.to?.toISOString(),
      totalRequests: events.length,
      totalPromptTokens,
      totalCompletionTokens,
      byIntent,
      projects: projectIds.map((projectId) => {
        const stats = perProject.get(projectId);
        return {
          projectId,
          projectName: nameById.get(projectId) ?? projectId,
          totalRequests: stats?.requests ?? 0,
          totalPromptTokens: stats?.prompt ?? 0,
          totalCompletionTokens: stats?.completion ?? 0,
        };
      }),
    };
  }

  async getKnowledgeMetrics(
    projectId: string,
    fromRaw?: string,
    toRaw?: string,
  ): Promise<ProjectKnowledgeUsageData> {
    await this.projects.assertExists(projectId);
    const range = parseUsageRangeQuery(fromRaw, toRaw);

    const sources = await this.knowledgeSourceModel
      .find({
        ...withProjectId(projectId),
        ...buildCreatedAtFilter(range),
      })
      .exec();

    const byType: Record<string, number> = {};
    let sourcesReady = 0;
    let sourcesPending = 0;
    let sourcesError = 0;
    let totalBytes = 0;
    let chunkCountFromSources = 0;

    for (const source of sources) {
      byType[source.type] = (byType[source.type] ?? 0) + 1;
      totalBytes += source.byteSize ?? 0;
      chunkCountFromSources += source.chunkCount ?? 0;
      if (source.status === 'ready') {
        sourcesReady += 1;
      } else if (source.status === 'pending') {
        sourcesPending += 1;
      } else if (source.status === 'error') {
        sourcesError += 1;
      }
    }

    const chunkAgg = await this.knowledgeChunkModel
      .aggregate<{ totalChars: number; count: number }>([
        { $match: withProjectId(projectId) },
        {
          $group: {
            _id: null,
            totalChars: { $sum: { $strLenCP: '$content' } },
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    const totalChunks = chunkAgg[0]?.count ?? chunkCountFromSources;
    const estimatedEmbeddingTokens = estimateTokensFromText(
      chunkAgg[0]?.totalChars ?? 0,
    );

    return {
      projectId,
      from: range.from?.toISOString(),
      to: range.to?.toISOString(),
      sourcesTotal: sources.length,
      sourcesReady,
      sourcesPending,
      sourcesError,
      totalChunks,
      totalBytes,
      estimatedEmbeddingTokens,
      byType,
    };
  }

  async getSessionMetrics(
    projectId: string,
    fromRaw?: string,
    toRaw?: string,
  ): Promise<ProjectSessionUsageData> {
    await this.projects.assertExists(projectId);
    const range = parseUsageRangeQuery(fromRaw, toRaw);
    const dateFilter = buildCreatedAtFilter(range);

    const [sessionsCreated, messageStats, chatEvents] = await Promise.all([
      this.chatSessionModel
        .countDocuments({ ...withProjectId(projectId), ...dateFilter })
        .exec(),
      this.chatMessageModel
        .aggregate<{ _id: string; count: number }>([
          { $match: { ...withProjectId(projectId), ...dateFilter } },
          { $group: { _id: '$role', count: { $sum: 1 } } },
        ])
        .exec(),
      this.usageModel
        .find({
          ...withProjectId(projectId),
          route: 'sdk/chat',
          ...dateFilter,
        })
        .exec(),
    ]);

    let userMessages = 0;
    let assistantMessages = 0;
    for (const row of messageStats) {
      if (row._id === 'user') {
        userMessages = row.count;
      } else if (row._id === 'assistant') {
        assistantMessages = row.count;
      }
    }

    const chatAgg = this.aggregateEvents(chatEvents);

    return {
      projectId,
      from: range.from?.toISOString(),
      to: range.to?.toISOString(),
      sessionsCreated,
      messagesTotal: userMessages + assistantMessages,
      userMessages,
      assistantMessages,
      chatRequestsInRange: chatAgg.totalRequests,
      byIntent: chatAgg.byIntent,
    };
  }

  async exportProjectUsage(
    projectId: string,
    format: 'csv' | 'json',
    fromRaw?: string,
    toRaw?: string,
    redactApiKeys?: boolean,
  ): Promise<{ body: string; contentType: string; filename: string }> {
    await this.projects.assertExists(projectId);
    const range = parseUsageRangeQuery(fromRaw, toRaw);

    const rows = await this.usageModel
      .find({
        ...withProjectId(projectId),
        ...buildCreatedAtFilter(range),
      })
      .sort({ createdAt: -1 })
      .limit(EXPORT_MAX_ROWS)
      .exec();

    const items = rows.map((row) => this.toEventData(row, redactApiKeys));
    const stamp = new Date().toISOString().slice(0, 10);

    if (format === 'json') {
      return {
        body: JSON.stringify({ projectId, exportedAt: new Date().toISOString(), items }, null, 2),
        contentType: 'application/json; charset=utf-8',
        filename: `usage-${projectId}-${stamp}.json`,
      };
    }

    return {
      body: usageEventsToCsv(items),
      contentType: 'text/csv; charset=utf-8',
      filename: `usage-${projectId}-${stamp}.csv`,
    };
  }

  private aggregateEvents(events: UsageEventDocument[]) {
    const byIntent: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    const byApiKey: Record<string, number> = {};
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    for (const event of events) {
      const intent = event.intent ?? 'unknown';
      byIntent[intent] = (byIntent[intent] ?? 0) + 1;
      totalPromptTokens += event.promptTokens ?? 0;
      totalCompletionTokens += event.completionTokens ?? 0;

      const model = event.llmModel ?? 'unknown';
      byModel[model] = (byModel[model] ?? 0) + 1;

      const keyLabel = event.apiKeyId ?? 'unknown';
      byApiKey[keyLabel] = (byApiKey[keyLabel] ?? 0) + 1;
    }

    return {
      totalRequests: events.length,
      totalPromptTokens,
      totalCompletionTokens,
      byIntent,
      byModel,
      byApiKey,
    };
  }

  private emptyPlatformUsageOverview(
    from: Date,
    to: Date,
    configuredProvider: string,
  ): PlatformUsageOverviewData {
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      configuredProvider,
      totalRequests: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalErrors: 0,
      errorRate: 0,
      p95LatencyMs: null,
      byProvider: {},
      byModel: {},
      byIntent: {},
      buckets: [],
      topAccounts: [],
      topProjects: [],
    };
  }

  private toEventData(
    doc: UsageEventDocument,
    redactApiKeys?: boolean,
  ): UsageEventData {
    return {
      id: doc._id.toString(),
      projectId: doc.projectId,
      route: doc.route,
      intent: doc.intent,
      provider: doc.llmProvider,
      model: doc.llmModel,
      promptTokens: doc.promptTokens,
      completionTokens: doc.completionTokens,
      apiKeyId: redactApiKeys ? undefined : doc.apiKeyId,
      latencyMs: doc.latencyMs,
      success: doc.success !== false,
      errorCode: doc.errorCode,
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
    };
  }

  private startOfUtcMonth(): Date {
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);
    return startOfMonth;
  }
}
