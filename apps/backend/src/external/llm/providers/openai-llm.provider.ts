import { Logger } from '@nestjs/common';
import type { OpenAiLlmConfig } from '../../../config/llm.config';
import { LlmProviderException } from '../exceptions/llm-provider.exception';
import { LlmAbortedError, postJson, postJsonStream } from '../llm-http';
import { mapLlmProviderError } from '../llm-provider-error.util';
import { toOpenAiMessages } from '../llm-message.util';
import type {
  LlmCompletionResult,
  LlmMessage,
  LlmProvider,
  LlmStreamHandlers,
  LlmStreamOptions,
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

  async completeStream(
    messages: LlmMessage[],
    handlers: LlmStreamHandlers,
    options?: LlmStreamOptions,
  ): Promise<LlmCompletionResult> {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`;

    let accumulated = '';
    let model = this.config.model;
    let promptTokens: number | undefined;
    let completionTokens: number | undefined;

    try {
      await postJsonStream(url, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: {
          model: this.config.model,
          messages: toOpenAiMessages(messages),
          stream: true,
          stream_options: { include_usage: true },
        },
        timeoutMs: this.timeoutMs,
        signal: options?.signal,
        onSseData: (raw) => {
          let data: {
            model?: string;
            choices?: Array<{ delta?: { content?: string } }>;
            usage?: {
              prompt_tokens?: number;
              completion_tokens?: number;
            };
          };
          try {
            data = JSON.parse(raw) as typeof data;
          } catch {
            return;
          }

          if (data.model) model = data.model;
          const delta = data.choices?.[0]?.delta?.content;
          if (delta) {
            accumulated += delta;
            handlers.onDelta(delta);
          }
          if (data.usage?.prompt_tokens != null) {
            promptTokens = data.usage.prompt_tokens;
          }
          if (data.usage?.completion_tokens != null) {
            completionTokens = data.usage.completion_tokens;
          }
        },
      });
    } catch (error) {
      if (error instanceof LlmAbortedError && accumulated) {
        return {
          content: accumulated,
          model,
          promptTokens,
          completionTokens,
        };
      }
      throw mapLlmProviderError('OpenAI', error, this.logger);
    }

    if (!accumulated) {
      throw LlmProviderException.upstream('OpenAI returned an empty response');
    }

    return {
      content: accumulated,
      model,
      promptTokens,
      completionTokens,
    };
  }
}
