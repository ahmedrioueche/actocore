import type { OpenAiLlmConfig } from '../../../config/llm.config';
import { LlmProviderException } from '../exceptions/llm-provider.exception';
import { LlmHttpError, LlmTimeoutError, postJson } from '../llm-http';
import { toOpenAiMessages } from '../llm-message.util';
import type {
  LlmCompletionResult,
  LlmMessage,
  LlmProvider,
} from '../llm-provider.interface';

interface OpenAiChatResponse {
  model: string;
  choices: Array<{
    message: { content: string };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

export class OpenAiLlmProvider implements LlmProvider {
  constructor(
    private readonly config: OpenAiLlmConfig,
    private readonly timeoutMs: number,
  ) {}

  async complete(messages: LlmMessage[]): Promise<LlmCompletionResult> {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`;

    try {
      const data = await postJson<OpenAiChatResponse>(url, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: {
          model: this.config.model,
          messages: toOpenAiMessages(messages),
        },
        timeoutMs: this.timeoutMs,
      });

      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw LlmProviderException.upstream('OpenAI returned an empty response');
      }

      return {
        content,
        model: data.model ?? this.config.model,
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
      };
    } catch (error) {
      throw this.mapError(error, 'OpenAI');
    }
  }

  private mapError(error: unknown, label: string): LlmProviderException {
    if (error instanceof LlmTimeoutError) {
      return LlmProviderException.timeout();
    }
    if (error instanceof LlmHttpError) {
      return LlmProviderException.upstream(
        `${label} API error (${error.status})`,
      );
    }
    if (error instanceof LlmProviderException) {
      return error;
    }
    return LlmProviderException.upstream(`${label} request failed`);
  }
}
