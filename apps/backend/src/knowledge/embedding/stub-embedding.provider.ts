import { Injectable } from '@nestjs/common';
import type { EmbeddingProvider } from './embedding-provider.interface';

const DIMENSIONS = 128;

/**
 * Deterministic bag-of-words style vectors for local dev and tests.
 * Replace with OpenAI embeddings in production when configured.
 */
@Injectable()
export class StubEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = DIMENSIONS;

  async embed(text: string): Promise<number[]> {
    const vectors = await this.embedBatch([text]);
    return vectors[0] ?? new Array<number>(DIMENSIONS).fill(0);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.embedOne(text)));
  }

  private async embedOne(text: string): Promise<number[]> {
    const vector = new Array<number>(DIMENSIONS).fill(0);
    const tokens = tokenize(text);

    for (const token of tokens) {
      const index = hashToken(token) % DIMENSIONS;
      vector[index] += 1;
    }

    return normalize(vector);
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function hashToken(token: string): number {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) {
    return vector;
  }
  return vector.map((v) => v / magnitude);
}
