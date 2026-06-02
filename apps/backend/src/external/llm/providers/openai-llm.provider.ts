import { Logger } from '@nestjs/common';
import type { OpenAiLlmConfig } from '../../../config/llm.config';
import { LlmProviderException } from '../exceptions/llm-provider.exception';
import { postJson } from '../llm-http';
import { mapLlmProviderError } from '../llm-provider-error.util';
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
  private readonly logger = new Logger(OpenAiLlmProvider.name);

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
      throw mapLlmProviderError('OpenAI', error, this.logger);
    }
  }
}
