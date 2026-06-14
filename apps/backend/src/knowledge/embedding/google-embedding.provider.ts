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

/** Default output size for gemini-embedding-001 without outputDimensionality. */
const DEFAULT_DIMENSIONS = 768;

const RETRIEVAL_DOCUMENT_TASK = 'RETRIEVAL_DOCUMENT';

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
    const modelResource = toGoogleEmbeddingModelResource(this.config.model);
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/models/${toGoogleEmbeddingModelSlug(this.config.model)}:embedContent?key=${encodeURIComponent(this.config.apiKey)}`;

    const data = await postJson<GeminiEmbedResponse>(url, {
      headers: {},
      body: {
        model: modelResource,
        content: {
          parts: [{ text }],
        },
        taskType: RETRIEVAL_DOCUMENT_TASK,
      },
      timeoutMs: this.timeoutMs,
    });

    return readEmbeddingValues(
      data.embedding?.values,
      'Gemini returned an empty embedding',
    );
  }

  private async embedMany(texts: string[]): Promise<number[][]> {
    const modelResource = toGoogleEmbeddingModelResource(this.config.model);
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/models/${toGoogleEmbeddingModelSlug(this.config.model)}:batchEmbedContents?key=${encodeURIComponent(this.config.apiKey)}`;

    const data = await postJson<GeminiBatchEmbedResponse>(url, {
      headers: {},
      body: {
        requests: texts.map((text) => ({
          model: modelResource,
          content: {
            parts: [{ text }],
          },
          taskType: RETRIEVAL_DOCUMENT_TASK,
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

/** Body field: `models/gemini-embedding-001`. */
export function toGoogleEmbeddingModelResource(model: string): string {
  const trimmed = model.trim();
  return trimmed.startsWith('models/') ? trimmed : `models/${trimmed}`;
}

/** URL path segment only: `gemini-embedding-001` (no `models/` prefix). */
export function toGoogleEmbeddingModelSlug(model: string): string {
  const resource = toGoogleEmbeddingModelResource(model);
  return resource.slice('models/'.length);
}

function readEmbeddingValues(
  values: number[] | undefined,
  message: string,
): number[] {
  if (!values?.length) {
    throw new LlmHttpError(502, message);
  }
  return values;
}
