import type { GoogleLlmConfig } from '../../../config/llm.config';
import { LlmProviderException } from '../exceptions/llm-provider.exception';
import { LlmHttpError, LlmTimeoutError, postJson } from '../llm-http';
import { toGeminiPayload } from '../llm-message.util';
import type {
  LlmCompletionResult,
  LlmMessage,
  LlmProvider,
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
      throw this.mapError(error, 'Gemini');
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
