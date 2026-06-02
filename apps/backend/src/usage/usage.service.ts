import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  ChatIntent,
  TokenUsageData,
  UsageSummaryData,
} from '@ahmedrioueche/actocore-shared';
import { Model } from 'mongoose';
import { withProjectId } from '../common/tenant/tenant-scope';
import { ProjectsService } from '../projects/projects.service';
import { UsageEvent, UsageEventDocument } from './schemas/usage-event.schema';

export interface RecordChatUsageInput {
  projectId: string;
  apiKeyId?: string;
  intent: ChatIntent;
  usage?: TokenUsageData;
}

@Injectable()
export class UsageService {
  constructor(
    @InjectModel(UsageEvent.name)
    private readonly usageModel: Model<UsageEventDocument>,
    private readonly projects: ProjectsService,
  ) {}

  async recordChatUsage(input: RecordChatUsageInput): Promise<void> {
    await this.usageModel.create({
      projectId: input.projectId,
      route: 'sdk/chat',
      intent: input.intent,
      llmModel: input.usage?.model,
      promptTokens: input.usage?.promptTokens,
      completionTokens: input.usage?.completionTokens,
      apiKeyId: input.apiKeyId,
    });
  }

  async countChatRequestsThisMonth(projectId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    return this.usageModel
      .countDocuments({
        ...withProjectId(projectId),
        route: 'sdk/chat',
        createdAt: { $gte: startOfMonth },
      })
      .exec();
  }

  async getProjectSummary(projectId: string): Promise<UsageSummaryData> {
    await this.projects.assertExists(projectId);

    const events = await this.usageModel
      .find(withProjectId(projectId))
      .exec();

    const byIntent: Record<string, number> = {};
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    for (const event of events) {
      const intent = event.intent ?? 'unknown';
      byIntent[intent] = (byIntent[intent] ?? 0) + 1;
      totalPromptTokens += event.promptTokens ?? 0;
      totalCompletionTokens += event.completionTokens ?? 0;
    }

    return {
      projectId,
      totalRequests: events.length,
      totalPromptTokens,
      totalCompletionTokens,
      byIntent,
    };
  }
}
