import { Logger } from '@nestjs/common';
import type { AnthropicLlmConfig } from '../../../config/llm.config';
import { LlmProviderException } from '../exceptions/llm-provider.exception';
import { LlmAbortedError, postJson, postJsonStream } from '../llm-http';
import { mapLlmProviderError } from '../llm-provider-error.util';
import { toAnthropicPayload } from '../llm-message.util';
import type {
  LlmCompletionResult,
  LlmMessage,
  LlmProvider,
  LlmStreamHandlers,
  LlmStreamOptions,
} from '../llm-provider.interface';

interface AnthropicMessageResponse {
  model: string;
  content: Array<{ type: string; text?: string }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

export class AnthropicLlmProvider implements LlmProvider {
  private readonly logger = new Logger(AnthropicLlmProvider.name);

  constructor(
    private readonly config: AnthropicLlmConfig,
    private readonly timeoutMs: number,
  ) {}

  async complete(messages: LlmMessage[]): Promise<LlmCompletionResult> {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/messages`;
    const { system, messages: anthropicMessages } =
      toAnthropicPayload(messages);

    if (anthropicMessages.length === 0) {
      throw LlmProviderException.upstream(
        'Anthropic requires at least one user or assistant message',
      );
    }

    try {
      const data = await postJson<AnthropicMessageResponse>(url, {
        headers: {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: {
          model: this.config.model,
          max_tokens: 4096,
          ...(system ? { system } : {}),
          messages: anthropicMessages,
        },
        timeoutMs: this.timeoutMs,
      });

      const textBlock = data.content.find((b) => b.type === 'text');
      const content = textBlock?.text;
      if (!content) {
        throw LlmProviderException.upstream(
          'Anthropic returned an empty response',
        );
      }

      return {
        content,
        model: data.model ?? this.config.model,
        promptTokens: data.usage?.input_tokens,
        completionTokens: data.usage?.output_tokens,
      };
    } catch (error) {
      throw mapLlmProviderError('Anthropic', error, this.logger);
    }
  }

  async completeStream(
    messages: LlmMessage[],
    handlers: LlmStreamHandlers,
    options?: LlmStreamOptions,
  ): Promise<LlmCompletionResult> {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/messages`;
    const { system, messages: anthropicMessages } =
      toAnthropicPayload(messages);

    if (anthropicMessages.length === 0) {
      throw LlmProviderException.upstream(
        'Anthropic requires at least one user or assistant message',
      );
    }

    let accumulated = '';
    let model = this.config.model;
    let promptTokens: number | undefined;
    let completionTokens: number | undefined;

    try {
      await postJsonStream(url, {
        headers: {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: {
          model: this.config.model,
          max_tokens: 4096,
          stream: true,
          ...(system ? { system } : {}),
          messages: anthropicMessages,
        },
        timeoutMs: this.timeoutMs,
        signal: options?.signal,
        onSseData: (raw) => {
          let data: {
            type?: string;
            delta?: { type?: string; text?: string };
            message?: { model?: string; usage?: { input_tokens?: number } };
            usage?: { output_tokens?: number };
          };
          try {
            data = JSON.parse(raw) as typeof data;
          } catch {
            return;
          }

          if (data.type === 'message_start' && data.message?.model) {
            model = data.message.model;
          }
          if (data.message?.usage?.input_tokens != null) {
            promptTokens = data.message.usage.input_tokens;
          }
          if (data.type === 'content_block_delta' && data.delta?.text) {
            accumulated += data.delta.text;
            handlers.onDelta(data.delta.text);
          }
          if (data.type === 'message_delta' && data.usage?.output_tokens != null) {
            completionTokens = data.usage.output_tokens;
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
      throw mapLlmProviderError('Anthropic', error, this.logger);
    }

    if (!accumulated) {
      throw LlmProviderException.upstream(
        'Anthropic returned an empty response',
      );
    }

    return {
      content: accumulated,
      model,
      promptTokens,
      completionTokens,
    };
  }
}
