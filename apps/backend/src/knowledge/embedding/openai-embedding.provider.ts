import { Injectable } from '@nestjs/common';
import type { OpenAiLlmConfig } from '../../config/llm.config';
import { LlmHttpError, postJson } from '../../external/llm/llm-http';
import type { EmbeddingProvider } from './embedding-provider.interface';

interface OpenAiEmbeddingResponse {
  data: Array<{ embedding: number[] }>;
}

@Injectable()
export class OpenAiEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = 1536;

  constructor(
    private readonly config: OpenAiLlmConfig,
    private readonly timeoutMs: number,
  ) {}

  async embed(text: string): Promise<number[]> {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/embeddings`;

    const data = await postJson<OpenAiEmbeddingResponse>(url, {
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
      body: {
        model: process.env.OPENAI_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small',
        input: text,
      },
      timeoutMs: this.timeoutMs,
    });

    const embedding = data.data[0]?.embedding;
    if (!embedding?.length) {
      throw new LlmHttpError(502, 'OpenAI returned an empty embedding');
    }

    return embedding;
  }
}
