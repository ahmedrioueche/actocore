import { Injectable } from '@nestjs/common';
import type { GoogleLlmConfig } from '../../config/llm.config';
import { LlmHttpError, postJson } from '../../external/llm/llm-http';
import type { EmbeddingProvider } from './embedding-provider.interface';

interface GeminiEmbedResponse {
  embedding?: { values?: number[] };
}

interface GeminiBatchEmbedResponse {
  embeddings?: Array<{ values?: number[] }>;
}

/** Default output size for text-embedding-004 without outputDimensionality. */
const DEFAULT_DIMENSIONS = 768;

@Injectable()
export class GoogleEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = DEFAULT_DIMENSIONS;

  constructor(
    private readonly config: GoogleLlmConfig,
    private readonly timeoutMs: number,
  ) {}

  async embed(text: string): Promise<number[]> {
    const vectors = await this.embedBatch([text]);
    const embedding = vectors[0];
    if (!embedding?.length) {
      throw new LlmHttpError(502, 'Gemini returned an empty embedding');
    }
    return embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const batchSize = 32;
    const results: number[][] = [];

    for (let offset = 0; offset < texts.length; offset += batchSize) {
      const batch = texts.slice(offset, offset + batchSize);
      const chunk =
        batch.length === 1
          ? [await this.embedOne(batch[0]!)]
          : await this.embedMany(batch);
      results.push(...chunk);
    }

    return results;
  }

  private async embedOne(text: string): Promise<number[]> {
    const base = this.config.baseUrl.replace(/\/$/, '');
    const model = encodeURIComponent(normalizeGoogleModelId(this.config.model));
    const url = `${base}/models/${model}:embedContent?key=${encodeURIComponent(this.config.apiKey)}`;

    const data = await postJson<GeminiEmbedResponse>(url, {
      headers: {},
      body: {
        model: normalizeGoogleModelId(this.config.model),
        content: {
          parts: [{ text }],
        },
      },
      timeoutMs: this.timeoutMs,
    });

    return readEmbeddingValues(data.embedding?.values, 'Gemini returned an empty embedding');
  }

  private async embedMany(texts: string[]): Promise<number[][]> {
    const base = this.config.baseUrl.replace(/\/$/, '');
    const model = normalizeGoogleModelId(this.config.model);
    const url = `${base}/models/${encodeURIComponent(model)}:batchEmbedContents?key=${encodeURIComponent(this.config.apiKey)}`;

    const data = await postJson<GeminiBatchEmbedResponse>(url, {
      headers: {},
      body: {
        requests: texts.map((text) => ({
          model,
          content: {
            parts: [{ text }],
          },
        })),
      },
      timeoutMs: this.timeoutMs,
    });

    if (!data.embeddings?.length) {
      throw new LlmHttpError(502, 'Gemini returned no batch embeddings');
    }

    if (data.embeddings.length !== texts.length) {
      throw new LlmHttpError(
        502,
        `Gemini returned ${data.embeddings.length} embeddings for ${texts.length} inputs`,
      );
    }

    return data.embeddings.map((entry, index) =>
      readEmbeddingValues(
        entry.values,
        `Gemini returned an empty embedding at index ${index}`,
      ),
    );
  }
}

function normalizeGoogleModelId(model: string): string {
  const trimmed = model.trim();
  return trimmed.startsWith('models/') ? trimmed : `models/${trimmed}`;
}

function readEmbeddingValues(values: number[] | undefined, message: string): number[] {
  if (!values?.length) {
    throw new LlmHttpError(502, message);
  }
  return values;
}
