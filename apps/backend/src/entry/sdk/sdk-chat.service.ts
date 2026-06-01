import { Inject, Injectable } from '@nestjs/common';
import type {
  ChatMessageData,
  RequestContextData,
  SendChatMessageDto,
} from '@ahmedrioueche/actocore-shared';
import { LLM_PROVIDER, type LlmProvider } from '../../external/llm/llm-provider.interface';
import type { LlmMessage } from '../../external/llm/llm-provider.interface';
import { SdkSessionStore } from './sdk-session.store';

@Injectable()
export class SdkChatService {
  constructor(
    private readonly sessions: SdkSessionStore,
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
  ) {}

  async sendMessage(
    context: RequestContextData,
    body: SendChatMessageDto,
  ): Promise<ChatMessageData> {
    const projectId = context.projectId;
    const sessionId =
      body.sessionId ?? this.sessions.create(projectId, {}).id;

    this.sessions.appendMessage(projectId, sessionId, 'user', body.message);

    const completion = await this.llm.complete(
      this.buildMessages(context, body.message),
    );

    const assistant = this.sessions.appendMessage(
      projectId,
      sessionId,
      'assistant',
      completion.content,
    );

    return {
      sessionId,
      messageId: assistant.id,
      role: 'assistant',
      content: assistant.content,
    };
  }

  private buildMessages(
    context: RequestContextData,
    userMessage: string,
  ): LlmMessage[] {
    const messages: LlmMessage[] = [];

    if (context.settings.systemPrompt) {
      messages.push({ role: 'system', content: context.settings.systemPrompt });
    }

    if (context.settings.rules?.length) {
      messages.push({
        role: 'system',
        content: `Follow these rules:\n${context.settings.rules.join('\n')}`,
      });
    }

    if (context.settings.tone) {
      messages.push({
        role: 'system',
        content: `Use a ${context.settings.tone} tone.`,
      });
    }

    messages.push({ role: 'user', content: userMessage });
    return messages;
  }
}
