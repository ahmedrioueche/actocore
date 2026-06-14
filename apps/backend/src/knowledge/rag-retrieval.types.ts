import type { QaSourceCitation } from '@ahmedrioueche/actocore-shared';

export type RagEmptyReason =
  | 'no_chunks'
  | 'no_candidates'
  | 'below_threshold'
  | 'context_budget_exceeded';

export interface RagRetrievalLogChunk {
  chunkId: string;
  sourceId: string;
  score: number;
}

export interface RagRetrievalLog {
  emptyReason?: RagEmptyReason;
  candidateCount: number;
  contextPartCount: number;
  topScore?: number;
  chunks: RagRetrievalLogChunk[];
  originalQuery?: string;
  searchQuery?: string;
  queryRewritten?: boolean;
  currentPageId?: string;
  pageBoostWeight?: number;
}

export interface RagRetrievalOptions {
  /** Mongo app page id from hostContext.currentPage slug resolution. */
  currentPageId?: string;
}

export interface RagRankedHit {
  chunkId: string;
  sourceId: string;
  score: number;
  content: string;
}

export interface RagRetrievalResult {
  contextBlock: string;
  citations: QaSourceCitation[];
  emptyReason?: RagEmptyReason;
  retrievalLog: RagRetrievalLog;
  /** Top ranked child chunks after hybrid scoring and rerank (for eval/debug). */
  rankedHits: RagRankedHit[];
}

export const RAG_RETRIEVAL_LOG_CHUNK_LIMIT = 4;
