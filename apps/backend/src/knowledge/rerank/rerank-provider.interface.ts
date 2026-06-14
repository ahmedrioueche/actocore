export interface RerankDocument {
  id: string;
  text: string;
}

export interface RerankResult {
  id: string;
  score: number;
}

export interface RerankProvider {
  isEnabled(): boolean;
  rerank(
    query: string,
    documents: RerankDocument[],
    topN: number,
  ): Promise<RerankResult[]>;
}

export const RERANK_PROVIDER = Symbol('RERANK_PROVIDER');

export function readRerankProviderName(): string {
  return process.env.RERANK_PROVIDER?.trim().toLowerCase() || 'none';
}
