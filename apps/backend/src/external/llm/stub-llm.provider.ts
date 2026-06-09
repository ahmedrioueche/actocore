import { Injectable } from '@nestjs/common';
import type {
  LlmCompletionResult,
  LlmMessage,
  LlmProvider,
} from './llm-provider.interface';

/** Default when `LLM_PROVIDER=stub` (no external API calls). */
@Injectable()
export class StubLlmProvider implements LlmProvider {
  async complete(messages: LlmMessage[]): Promise<LlmCompletionResult> {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');

    return {
      content: `[stub] Received: ${lastUser?.content ?? '(empty)'}`,
      model: 'stub',
      promptTokens: 10,
      completionTokens: 5,
    };
  }
}
