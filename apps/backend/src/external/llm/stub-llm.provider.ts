import { Injectable } from '@nestjs/common';
import type {
  LlmCompletionResult,
  LlmMessage,
  LlmProvider,
} from './llm-provider.interface';

/** Development placeholder until OpenAI / Claude adapters are wired. */
@Injectable()
export class StubLlmProvider implements LlmProvider {
  async complete(messages: LlmMessage[]): Promise<LlmCompletionResult> {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');

    return {
      content: `[stub] Received: ${lastUser?.content ?? '(empty)'}`,
      model: 'stub',
    };
  }
}
