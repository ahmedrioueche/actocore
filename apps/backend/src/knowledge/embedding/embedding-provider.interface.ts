export interface EmbeddingProvider {
  readonly dimensions: number;
  embed(text: string): Promise<number[]>;
}

export const EMBEDDING_PROVIDER = Symbol('EMBEDDING_PROVIDER');
