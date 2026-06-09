import { Logger } from '@nestjs/common';
import type { GoogleLlmConfig } from '../../../config/llm.config';
import { LlmProviderException } from '../exceptions/llm-provider.exception';
import { LlmAbortedError, postJson, postJsonStream } from '../llm-http';
import { mapLlmProviderError } from '../llm-provider-error.util';
import { toGeminiPayload } from '../llm-message.util';
import type {
  LlmCompletionResult,
  LlmMessage,
  LlmProvider,
  LlmStreamHandlers,
  LlmStreamOptions,
} from '../llm-provider.interface';

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
}

export class GoogleLlmProvider implements LlmProvider {
  private readonly logger = new Logger(GoogleLlmProvider.name);

  constructor(
    private readonly config: GoogleLlmConfig,
    private readonly timeoutMs: number,
  ) {}

  async complete(messages: LlmMessage[]): Promise<LlmCompletionResult> {
    const base = this.config.baseUrl.replace(/\/$/, '');
    const model = encodeURIComponent(this.config.model);
    const url = `${base}/models/${model}:generateContent?key=${encodeURIComponent(this.config.apiKey)}`;

    const { systemInstruction, contents } = toGeminiPayload(messages);

    if (contents.length === 0) {
      throw LlmProviderException.upstream(
        'Gemini requires at least one user or model message',
      );
    }

    try {
      const data = await postJson<GeminiGenerateResponse>(url, {
        headers: {},
        body: {
          ...(systemInstruction ? { systemInstruction } : {}),
          contents,
        },
        timeoutMs: this.timeoutMs,
      });

      const content =
        data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw LlmProviderException.upstream('Gemini returned an empty response');
      }

      return {
        content,
        model: this.config.model,
        promptTokens: data.usageMetadata?.promptTokenCount,
        completionTokens: data.usageMetadata?.candidatesTokenCount,
      };
    } catch (error) {
      throw mapLlmProviderError('Gemini', error, this.logger);
    }
  }

  async completeStream(
    messages: LlmMessage[],
    handlers: LlmStreamHandlers,
    options?: LlmStreamOptions,
  ): Promise<LlmCompletionResult> {
    const base = this.config.baseUrl.replace(/\/$/, '');
    const model = encodeURIComponent(this.config.model);
    const url = `${base}/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(this.config.apiKey)}`;

    const { systemInstruction, contents } = toGeminiPayload(messages);

    if (contents.length === 0) {
      throw LlmProviderException.upstream(
        'Gemini requires at least one user or model message',
      );
    }

    let accumulated = '';
    let promptTokens: number | undefined;
    let completionTokens: number | undefined;

    try {
      await postJsonStream(url, {
        headers: {},
        body: {
          ...(systemInstruction ? { systemInstruction } : {}),
          contents,
        },
        timeoutMs: this.timeoutMs,
        signal: options?.signal,
        onSseData: (raw) => {
          let data: GeminiGenerateResponse;
          try {
            data = JSON.parse(raw) as GeminiGenerateResponse;
          } catch {
            return;
          }

          const chunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (chunk) {
            let delta = chunk;
            if (accumulated && chunk.startsWith(accumulated)) {
              delta = chunk.slice(accumulated.length);
            }
            if (delta) {
              accumulated += delta;
              handlers.onDelta(delta);
            }
          }

          if (data.usageMetadata?.promptTokenCount != null) {
            promptTokens = data.usageMetadata.promptTokenCount;
          }
          if (data.usageMetadata?.candidatesTokenCount != null) {
            completionTokens = data.usageMetadata.candidatesTokenCount;
          }
        },
      });
    } catch (error) {
      if (error instanceof LlmAbortedError && accumulated) {
        return {
          content: accumulated,
          model: this.config.model,
          promptTokens,
          completionTokens,
        };
      }
      throw mapLlmProviderError('Gemini', error, this.logger);
    }

    if (!accumulated) {
      throw LlmProviderException.upstream('Gemini returned an empty response');
    }

    return {
      content: accumulated,
      model: this.config.model,
      promptTokens,
      completionTokens,
    };
  }
}
