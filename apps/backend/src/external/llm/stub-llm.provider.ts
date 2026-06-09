import { Injectable } from '@nestjs/common';
import type {
  LlmCompletionResult,
  LlmMessage,
  LlmProvider,
  LlmStreamHandlers,
  LlmStreamOptions,
} from './llm-provider.interface';

function stubReply(messages: LlmMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  return `[stub] Received: ${lastUser?.content ?? '(empty)'}`;
}

/** Default when `LLM_PROVIDER=stub` (no external API calls). */
@Injectable()
export class StubLlmProvider implements LlmProvider {
  async complete(messages: LlmMessage[]): Promise<LlmCompletionResult> {
    const content = stubReply(messages);
    return {
      content,
      model: 'stub',
      promptTokens: 10,
      completionTokens: 5,
    };
  }

  async completeStream(
    messages: LlmMessage[],
    handlers: LlmStreamHandlers,
    options?: LlmStreamOptions,
  ): Promise<LlmCompletionResult> {
    const content = stubReply(messages);
    const words = content.split(/(\s+)/);
    let emitted = '';

    for (const part of words) {
      if (options?.signal?.aborted) break;
      emitted += part;
      handlers.onDelta(part);
      await new Promise((resolve) => setTimeout(resolve, 8));
    }

    return {
      content: emitted || content,
      model: 'stub',
      promptTokens: 10,
      completionTokens: Math.max(1, Math.ceil(emitted.length / 4)),
    };
  }
}
