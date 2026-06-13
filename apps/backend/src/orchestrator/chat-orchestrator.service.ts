import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ActionData,
  AppPageManifestEntry,
  ChatIntent,
  ChatMessageData,
  ChatStreamEvent,
  HostContext,
  RequestContextData,
  SendChatMessageDto,
  SessionMessageData,
  TokenUsageData,
} from '@ahmedrioueche/actocore-shared';
import { enrichHostContext } from '@ahmedrioueche/actocore-shared';
import { ActionRunnerService } from '../actions/action-runner.service';
import { ActionSelectorService } from '../actions/action-selector.service';
import { ActionsService } from '../actions/actions.service';
import { AppPagesService } from '../actions/app-pages.service';
import {
  QA_NO_CITATIONS_REPLY,
  QaRunnerService,
} from '../knowledge/qa-runner.service';
import { AiDecisionLogger } from '../observability/ai-decision.logger';
import {
  ChatResponseFormatter,
  type OrchestratorBranchPayload,
} from '../response/chat-response.formatter';
import { UsageService } from '../usage/usage.service';
import {
  INTENT_CLASSIFIER,
  type IntentClassifier,
} from './intent-classifier.interface';
import type { LlmResolvedConfig } from '../config/llm.config';
import { LLM_PROVIDER, type LlmMessage, type LlmProvider } from '../external/llm/llm-provider.interface';
import { resolveActionFollowUp } from '../actions/action-follow-up.util';
import { isLikelyActionMessage } from '../actions/natural-language-action.util';
import { buildAppAssistantSystemPrompt } from './app-assistant-prompt.util';
import {
  buildCurrentPageAnswer,
  isCurrentPageQuestion,
} from './current-page-question.util';
import { SessionsService } from '../sessions/sessions.service';
import { SdkConfigService } from '../projects/sdk-config/sdk-config.service';
import { estimateTokensFromText } from '../usage/utils/usage-export.util';

type ChatStreamEmitter = (event: ChatStreamEvent) => void;

/** Messages loaded for follow-up resolution and LLM context (bounded). */
const PREP_HISTORY_LIMIT = 60;
/** Max conversation messages sent to the LLM (~20 turns). */
const LLM_HISTORY_MESSAGE_LIMIT = 40;

interface PreparedIncomingMessage {
  projectId: string;
  sessionId: string;
  intent: ChatIntent;
  followUp: { actionName: string; input: Record<string, unknown> } | null;
  history: SessionMessageData[];
  enabledActions: ActionData[];
  hostContext?: HostContext;
  appPages?: AppPageManifestEntry[];
  currentPageId?: string;
}

@Injectable()
export class ChatOrchestratorService {
  private readonly logger = new Logger(ChatOrchestratorService.name);

  constructor(
    private readonly sessions: SessionsService,
    private readonly actions: ActionsService,
    private readonly appPages: AppPagesService,
    private readonly actionSelector: ActionSelectorService,
    private readonly actionRunner: ActionRunnerService,
    private readonly qaRunner: QaRunnerService,
    private readonly formatter: ChatResponseFormatter,
    private readonly aiLogger: AiDecisionLogger,
    private readonly usage: UsageService,
    private readonly sdkConfig: SdkConfigService,
    private readonly configService: ConfigService,
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
    @Inject(INTENT_CLASSIFIER) private readonly classifier: IntentClassifier,
  ) {}

  async sendMessage(
    context: RequestContextData,
    body: SendChatMessageDto,
  ): Promise<ChatMessageData> {
    const prep = await this.prepareIncomingMessage(context, body);
    const userMessage = await this.sessions.appendMessage(
      prep.projectId,
      prep.sessionId,
      'user',
      body.message,
    );
    const llmContext = this.withUserMessage(prep, userMessage);

    const startedAt = Date.now();
    const branch = prep.followUp
      ? await this.runActionBranchFromFollowUp(
          prep.projectId,
          prep.followUp,
          prep.enabledActions,
        )
      : await this.runBranch(
          prep.intent,
          context,
          llmContext,
          body.message,
        );

    return this.finalizeAssistantReply({
      context,
      projectId: prep.projectId,
      sessionId: prep.sessionId,
      intent: prep.intent,
      branch,
      startedAt,
    });
  }

  async sendMessageStream(
    context: RequestContextData,
    body: SendChatMessageDto,
    emit: ChatStreamEmitter,
    signal?: AbortSignal,
  ): Promise<void> {
    const streamStartedAt = Date.now();
    const projectId = context.projectId;
    const sessionId = await this.sessions.resolveSessionId(
      projectId,
      body.sessionId,
      {},
    );

    emit({ type: 'meta', sessionId });

    const prep = await this.prepareIncomingMessageForSession(
      context,
      body,
      sessionId,
    );

    emit({
      type: 'meta',
      sessionId: prep.sessionId,
      intent: prep.intent,
    });

    const userMessage = await this.sessions.appendMessage(
      prep.projectId,
      prep.sessionId,
      'user',
      body.message,
    );
    const llmContext = this.withUserMessage(prep, userMessage);

    this.logger.debug(
      `chat stream prep ${Date.now() - streamStartedAt}ms project=${projectId} session=${sessionId}`,
    );

    const startedAt = Date.now();
    const branch = prep.followUp
      ? await this.runActionBranchFromFollowUpStream(
          prep.projectId,
          prep.followUp,
          prep.enabledActions,
          emit,
        )
      : await this.runBranchStream(
          prep.intent,
          context,
          llmContext,
          body.message,
          emit,
          signal,
        );

    const cancelled = signal?.aborted ?? false;
    const usage = this.resolveStreamUsage(branch, cancelled);

    const response = await this.finalizeAssistantReply({
      context,
      projectId: prep.projectId,
      sessionId: prep.sessionId,
      intent: prep.intent,
      branch: { ...branch, usage },
      startedAt,
    });

    emit({
      type: 'done',
      message: response,
      ...(cancelled ? { cancelled: true } : {}),
    });
  }

  private async prepareIncomingMessage(
    context: RequestContextData,
    body: SendChatMessageDto,
  ): Promise<PreparedIncomingMessage> {
    const projectId = context.projectId;
    const sessionId = await this.sessions.resolveSessionId(
      projectId,
      body.sessionId,
      {},
    );
    return this.prepareIncomingMessageForSession(context, body, sessionId);
  }

  private async prepareIncomingMessageForSession(
    context: RequestContextData,
    body: SendChatMessageDto,
    sessionId: string,
  ): Promise<PreparedIncomingMessage> {
    const prepStartedAt = Date.now();
    const projectId = context.projectId;

    const [enabledActions, history, appPages] = await Promise.all([
      this.listProjectActions(projectId),
      this.sessions.listRecentMessages(
        projectId,
        sessionId,
        PREP_HISTORY_LIMIT,
      ),
      this.appPages.listManifest(projectId),
    ]);

    const hostContext = enrichHostContext(
      this.normalizeHostContext(body.hostContext),
      appPages,
    );
    const currentPageDoc = hostContext?.currentPage
      ? await this.appPages.requireBySlug(projectId, hostContext.currentPage)
      : null;
    const currentPageId = currentPageDoc?._id.toString();

    const enabledActionNames = enabledActions.map((a) => a.name);
    const followUp = resolveActionFollowUp(
      body.message,
      history,
      enabledActionNames,
    );

    let intent = await this.classifier.classify({
      context,
      message: body.message,
      sessionId,
      enabledActionNames,
    });

    if (followUp) {
      intent = 'action';
    } else if (
      intent === 'direct' &&
      enabledActionNames.length > 0 &&
      isLikelyActionMessage(body.message, enabledActionNames)
    ) {
      intent = 'action';
    }

    this.logger.debug(
      `chat prep ${Date.now() - prepStartedAt}ms project=${projectId} session=${sessionId}`,
    );

    return {
      projectId,
      sessionId,
      intent,
      followUp,
      history,
      enabledActions,
      hostContext,
      appPages,
      currentPageId,
    };
  }

  private normalizeHostContext(
    hostContext?: HostContext,
  ): HostContext | undefined {
    if (!hostContext) {
      return undefined;
    }

    const hasValue =
      hostContext.currentPage?.trim() ||
      hostContext.route?.trim() ||
      hostContext.selectedEntity ||
      hostContext.openModal?.trim() ||
      hostContext.userRole?.trim() ||
      (hostContext.custom && Object.keys(hostContext.custom).length > 0);

    return hasValue ? hostContext : undefined;
  }

  private tryAnswerCurrentPageQuestion(
    userMessage: string,
    hostContext: HostContext | undefined,
    appPages?: AppPageManifestEntry[],
  ): string | null {
    if (!isCurrentPageQuestion(userMessage)) {
      return null;
    }
    return buildCurrentPageAnswer(hostContext, appPages);
  }

  private withUserMessage(
    prep: PreparedIncomingMessage,
    userMessage: SessionMessageData,
  ): PreparedIncomingMessage {
    return {
      ...prep,
      history: [...prep.history, userMessage],
    };
  }

  private resolveStreamUsage(
    branch: OrchestratorBranchPayload,
    cancelled: boolean,
  ): TokenUsageData | undefined {
    if (!branch.usage) return undefined;

    if (
      cancelled &&
      (branch.usage.completionTokens == null || branch.usage.completionTokens === 0)
    ) {
      return {
        ...branch.usage,
        completionTokens: estimateTokensFromText(branch.content.length),
      };
    }

    return branch.usage;
  }

  private async finalizeAssistantReply(input: {
    context: RequestContextData;
    projectId: string;
    sessionId: string;
    intent: ChatIntent;
    branch: OrchestratorBranchPayload;
    startedAt: number;
  }): Promise<ChatMessageData> {
    const { context, projectId, sessionId, intent, branch, startedAt } = input;

    const assistant = await this.sessions.appendMessage(
      projectId,
      sessionId,
      'assistant',
      branch.content,
    );

    const response = this.formatter.format({
      sessionId,
      messageId: assistant.id,
      intent,
      branch,
    });

    this.aiLogger.log({
      projectId,
      sessionId,
      intent,
      model: branch.usage?.model,
      promptTokens: branch.usage?.promptTokens,
      completionTokens: branch.usage?.completionTokens,
      actionName: branch.action?.actionName,
      actionStatus: branch.action?.status,
      sourceCount: branch.sources?.length ?? 0,
    });

    if (branch.action?.status === 'error' && branch.action.error) {
      this.aiLogger.logActionFailure(
        projectId,
        branch.action.actionName,
        branch.action.error,
      );
    }

    const actionFailed = branch.action?.status === 'error';
    const llmProvider =
      this.configService.getOrThrow<LlmResolvedConfig>('llm').provider;
    void this.usage
      .recordChatUsage({
        projectId,
        apiKeyId: context.apiKeyId,
        intent,
        llmProvider,
        usage: branch.usage,
        latencyMs: Date.now() - startedAt,
        success: !actionFailed,
        errorCode: actionFailed ? 'action_error' : undefined,
      })
      .catch(() => undefined);

    return response;
  }

  private async runBranchStream(
    intent: ChatIntent,
    context: RequestContextData,
    prep: PreparedIncomingMessage,
    userMessage: string,
    emit: ChatStreamEmitter,
    signal?: AbortSignal,
  ): Promise<OrchestratorBranchPayload> {
    switch (intent) {
      case 'direct':
        return this.completeWithLlmStream(context, prep, emit, signal);
      case 'qa':
        return this.runQaBranchStream(
          context,
          prep,
          userMessage,
          emit,
          signal,
        );
      case 'action':
        return this.runActionBranchStream(
          prep,
          userMessage,
          emit,
        );
      default: {
        const _exhaustive: never = intent;
        throw new Error(`Unsupported intent: ${String(_exhaustive)}`);
      }
    }
  }

  private async runQaBranchStream(
    context: RequestContextData,
    prep: PreparedIncomingMessage,
    userMessage: string,
    emit: ChatStreamEmitter,
    signal?: AbortSignal,
  ): Promise<OrchestratorBranchPayload> {
    const pageAnswer = this.tryAnswerCurrentPageQuestion(
      userMessage,
      prep.hostContext,
      prep.appPages,
    );
    if (pageAnswer) {
      emit({ type: 'delta', text: pageAnswer });
      return { content: pageAnswer };
    }

    const { modeNote, citations } = await this.qaRunner.buildPromptContext(
      prep.projectId,
      userMessage,
    );

    if (citations.length === 0) {
      if (isCurrentPageQuestion(userMessage) && prep.hostContext) {
        return this.completeWithLlmStream(context, prep, emit, signal, {
          modeNote:
            'The user is asking which page or screen they are on. Answer using ONLY Current user context and Application pages from the system prompt.',
        });
      }

      emit({ type: 'delta', text: QA_NO_CITATIONS_REPLY });
      return { content: QA_NO_CITATIONS_REPLY };
    }

    const result = await this.completeWithLlmStream(
      context,
      prep,
      emit,
      signal,
      { modeNote },
    );

    return {
      ...result,
      sources: citations,
    };
  }

  private async runActionBranchStream(
    prep: PreparedIncomingMessage,
    userMessage: string,
    emit: ChatStreamEmitter,
  ): Promise<OrchestratorBranchPayload> {
    const branch = await this.runActionBranch(prep, userMessage);
    emit({ type: 'delta', text: branch.content });
    return branch;
  }

  private async runActionBranchFromFollowUpStream(
    projectId: string,
    followUp: { actionName: string; input: Record<string, unknown> },
    enabledActions: ActionData[],
    emit: ChatStreamEmitter,
  ): Promise<OrchestratorBranchPayload> {
    const branch = await this.runActionBranchFromFollowUp(
      projectId,
      followUp,
      enabledActions,
    );
    emit({ type: 'delta', text: branch.content });
    return branch;
  }

  private async completeWithLlmStream(
    context: RequestContextData,
    prep: PreparedIncomingMessage,
    emit: ChatStreamEmitter,
    signal?: AbortSignal,
    options?: { modeNote?: string },
  ): Promise<OrchestratorBranchPayload> {
    const llmStartedAt = Date.now();
    const messages = this.buildMessagesFromPrep(
      context,
      prep,
      options?.modeNote,
    );

    const completion = await this.llm.completeStream(
      messages,
      {
        onDelta: (text) => emit({ type: 'delta', text }),
      },
      { signal },
    );

    this.logger.debug(
      `chat llm stream ${Date.now() - llmStartedAt}ms project=${prep.projectId} session=${prep.sessionId}`,
    );

    return {
      content: completion.content,
      usage: {
        model: completion.model,
        promptTokens: completion.promptTokens,
        completionTokens: completion.completionTokens,
      },
    };
  }

  private async runBranch(
    intent: ChatIntent,
    context: RequestContextData,
    prep: PreparedIncomingMessage,
    userMessage: string,
  ): Promise<OrchestratorBranchPayload> {
    switch (intent) {
      case 'direct':
        return this.completeWithLlm(context, prep);
      case 'qa':
        return this.runQaBranch(context, prep, userMessage);
      case 'action':
        return this.runActionBranch(
          prep,
          userMessage,
        );
      default: {
        const _exhaustive: never = intent;
        throw new Error(`Unsupported intent: ${String(_exhaustive)}`);
      }
    }
  }

  private async runQaBranch(
    context: RequestContextData,
    prep: PreparedIncomingMessage,
    userMessage: string,
  ): Promise<OrchestratorBranchPayload> {
    const pageAnswer = this.tryAnswerCurrentPageQuestion(
      userMessage,
      prep.hostContext,
      prep.appPages,
    );
    if (pageAnswer) {
      return { content: pageAnswer };
    }

    const { modeNote, citations } = await this.qaRunner.buildPromptContext(
      prep.projectId,
      userMessage,
    );

    if (citations.length === 0) {
      if (isCurrentPageQuestion(userMessage) && prep.hostContext) {
        return this.completeWithLlm(context, prep, {
          modeNote:
            'The user is asking which page or screen they are on. Answer using ONLY Current user context and Application pages from the system prompt.',
        });
      }

      return { content: QA_NO_CITATIONS_REPLY };
    }

    const result = await this.completeWithLlm(context, prep, { modeNote });

    return {
      ...result,
      sources: citations,
    };
  }

  private async listProjectActions(projectId: string) {
    const sdk = await this.sdkConfig.getConfig(projectId);
    const enabled = await this.actions.listEnabled(projectId);
    return this.sdkConfig.filterEnabledActions(projectId, enabled, sdk);
  }

  private async runActionBranch(
    prep: PreparedIncomingMessage,
    userMessage: string,
  ): Promise<OrchestratorBranchPayload> {
    const enabled = prep.enabledActions;
    if (enabled.length === 0) {
      return { content: this.actionRunner.formatNoActionsMessage() };
    }

    const [sectionNames, pageTitles] = await Promise.all([
      this.actions.sectionNameMap(prep.projectId),
      this.appPages.titleMap(prep.projectId),
    ]);
    const selection = await this.actionSelector.select(userMessage, enabled, {
      sectionNames,
      pageTitles,
      currentPageId: prep.currentPageId,
    });

    if (!selection) {
      return { content: this.actionRunner.formatNoMatchMessage(enabled) };
    }

    const prepared = this.actionRunner.prepareExecution(selection);
    return {
      content: prepared.content,
      action: prepared.action,
      intentOverride: prepared.intentOverride,
    };
  }

  private async runActionBranchFromFollowUp(
    projectId: string,
    followUp: { actionName: string; input: Record<string, unknown> },
    enabled: ActionData[],
  ): Promise<OrchestratorBranchPayload> {
    const action = enabled.find((a) => a.name === followUp.actionName);

    if (!action) {
      return { content: this.actionRunner.formatNoMatchMessage(enabled) };
    }

    const prepared = this.actionRunner.prepareExecution({
      action,
      input: followUp.input,
    });

    return {
      content: prepared.content,
      action: prepared.action,
      intentOverride: prepared.intentOverride,
    };
  }

  private async completeWithLlm(
    context: RequestContextData,
    prep: PreparedIncomingMessage,
    options?: { modeNote?: string },
  ): Promise<OrchestratorBranchPayload> {
    const messages = this.buildMessagesFromPrep(
      context,
      prep,
      options?.modeNote,
    );
    const completion = await this.llm.complete(messages);

    return {
      content: completion.content,
      usage: {
        model: completion.model,
        promptTokens: completion.promptTokens,
        completionTokens: completion.completionTokens,
      },
    };
  }

  async buildMessages(
    context: RequestContextData,
    projectId: string,
    sessionId: string,
    modeNote?: string,
  ): Promise<LlmMessage[]> {
    const [enabledActions, history] = await Promise.all([
      this.listProjectActions(projectId),
      this.sessions.listRecentMessages(
        projectId,
        sessionId,
        PREP_HISTORY_LIMIT,
      ),
    ]);

    return this.buildMessagesFromPrep(
      context,
      { projectId, sessionId, history, enabledActions } as PreparedIncomingMessage,
      modeNote,
    );
  }

  private buildMessagesFromPrep(
    context: RequestContextData,
    prep: Pick<
      PreparedIncomingMessage,
      'enabledActions' | 'history' | 'hostContext' | 'appPages'
    >,
    modeNote?: string,
  ): LlmMessage[] {
    const messages: LlmMessage[] = [];

    messages.push({
      role: 'system',
      content: buildAppAssistantSystemPrompt(
        context,
        prep.enabledActions.map((a) => a.name),
        {
          hostContext: prep.hostContext,
          appPages: prep.appPages,
        },
      ),
    });

    if (modeNote) {
      messages.push({ role: 'system', content: modeNote });
    }

    const tail = prep.history.slice(-LLM_HISTORY_MESSAGE_LIMIT);
    for (const entry of tail) {
      messages.push(this.toLlmMessage(entry));
    }

    return messages;
  }

  private toLlmMessage(message: SessionMessageData): LlmMessage {
    if (message.role === 'system') {
      return { role: 'system', content: message.content };
    }
    return {
      role: message.role,
      content: message.content,
    };
  }
}
