import { Injectable } from '@nestjs/common';
import type { OpenAiLlmConfig } from '../../config/llm.config';
import { LlmHttpError, postJson } from '../../external/llm/llm-http';
import type { EmbeddingProvider } from './embedding-provider.interface';

interface OpenAiEmbeddingResponse {
  data: Array<{ index: number; embedding: number[] }>;
}

@Injectable()
export class OpenAiEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = 1536;

  constructor(
    private readonly config: OpenAiLlmConfig,
    private readonly timeoutMs: number,
  ) {}

  async embed(text: string): Promise<number[]> {
    const vectors = await this.embedBatch([text]);
    const embedding = vectors[0];
    if (!embedding?.length) {
      throw new LlmHttpError(502, 'OpenAI returned an empty embedding');
    }
    return embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const url = `${this.config.baseUrl.replace(/\/$/, '')}/embeddings`;
    const model =
      process.env.OPENAI_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small';
    const batchSize = 64;
    const results: number[][] = [];

    for (let offset = 0; offset < texts.length; offset += batchSize) {
      const batch = texts.slice(offset, offset + batchSize);
      const data = await postJson<OpenAiEmbeddingResponse>(url, {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
        body: {
          model,
          input: batch,
        },
        timeoutMs: this.timeoutMs,
      });

      const ordered = [...data.data].sort(
        (left, right) => left.index - right.index,
      );
      for (const entry of ordered) {
        if (!entry.embedding?.length) {
          throw new LlmHttpError(502, 'OpenAI returned an empty embedding');
        }
        results.push(entry.embedding);
      }
    }

    return results;
  }
}
