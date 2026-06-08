import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ChatIntent,
  ChatMessageData,
  RequestContextData,
  SendChatMessageDto,
  SessionMessageData,
  TokenUsageData,
} from '@ahmedrioueche/actocore-shared';
import { ActionRunnerService } from '../actions/action-runner.service';
import { ActionSelectorService } from '../actions/action-selector.service';
import { ActionsService } from '../actions/actions.service';
import { QaRunnerService } from '../knowledge/qa-runner.service';
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
import { SessionsService } from '../sessions/sessions.service';
import { SdkConfigService } from '../projects/sdk-config/sdk-config.service';

@Injectable()
export class ChatOrchestratorService {
  constructor(
    private readonly sessions: SessionsService,
    private readonly actions: ActionsService,
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
    const projectId = context.projectId;
    const sessionId = await this.sessions.resolveSessionId(
      projectId,
      body.sessionId,
      {},
    );

    const enabledActions = await this.listProjectActions(projectId);
    const enabledActionNames = enabledActions.map((a) => a.name);
    const history = await this.sessions.listMessages(projectId, sessionId);
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

    await this.sessions.appendMessage(projectId, sessionId, 'user', body.message);

    const startedAt = Date.now();
    const branch = followUp
      ? await this.runActionBranchFromFollowUp(projectId, followUp)
      : await this.runBranch(
          intent,
          context,
          projectId,
          sessionId,
          body.message,
        );

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

  private async runBranch(
    intent: ChatIntent,
    context: RequestContextData,
    projectId: string,
    sessionId: string,
    userMessage: string,
  ): Promise<OrchestratorBranchPayload> {
    switch (intent) {
      case 'direct':
        return this.completeWithLlm(context, projectId, sessionId);
      case 'qa':
        return this.runQaBranch(context, projectId, sessionId, userMessage);
      case 'action':
        return this.runActionBranch(projectId, userMessage);
      default: {
        const _exhaustive: never = intent;
        throw new Error(`Unsupported intent: ${String(_exhaustive)}`);
      }
    }
  }

  private async runQaBranch(
    context: RequestContextData,
    projectId: string,
    sessionId: string,
    userMessage: string,
  ): Promise<OrchestratorBranchPayload> {
    const { modeNote, citations } = await this.qaRunner.buildPromptContext(
      projectId,
      userMessage,
    );

    const result = await this.completeWithLlm(context, projectId, sessionId, {
      modeNote,
    });

    return {
      ...result,
      sources: citations.length > 0 ? citations : undefined,
    };
  }

  private async listProjectActions(projectId: string) {
    const sdk = await this.sdkConfig.getConfig(projectId);
    const enabled = await this.actions.listEnabled(projectId);
    return this.sdkConfig.filterEnabledActions(projectId, enabled, sdk);
  }

  private async runActionBranch(
    projectId: string,
    userMessage: string,
  ): Promise<OrchestratorBranchPayload> {
    const enabled = await this.listProjectActions(projectId);

    if (enabled.length === 0) {
      return { content: this.actionRunner.formatNoActionsMessage() };
    }

    const sectionNames = await this.actions.sectionNameMap(projectId);
    const selection = await this.actionSelector.select(
      userMessage,
      enabled,
      sectionNames,
    );

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
  ): Promise<OrchestratorBranchPayload> {
    const enabled = await this.listProjectActions(projectId);
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
    projectId: string,
    sessionId: string,
    options?: { modeNote?: string },
  ): Promise<OrchestratorBranchPayload> {
    const messages = await this.buildMessages(
      context,
      projectId,
      sessionId,
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
    const messages: LlmMessage[] = [];
    const enabledActions = await this.actions.listEnabled(projectId);

    messages.push({
      role: 'system',
      content: buildAppAssistantSystemPrompt(
        context,
        enabledActions.map((a) => a.name),
      ),
    });

    if (modeNote) {
      messages.push({ role: 'system', content: modeNote });
    }

    const history = await this.sessions.listMessages(projectId, sessionId);
    for (const entry of history) {
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
