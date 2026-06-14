export type KnowledgeSourceType = 'text' | 'url' | 'document' | 'sitemap';

export type KnowledgeSourceStatus =
  | 'pending'
  | 'indexing'
  | 'ready'
  | 'error';

export interface KnowledgeFileMetadata {
  originalFilename: string;
  mimeType: string;
  byteSize: number;
}

export interface KnowledgeSourceData {
  id: string;
  projectId: string;
  type: KnowledgeSourceType;
  title: string;
  url?: string;
  status: KnowledgeSourceStatus;
  chunkCount: number;
  errorMessage?: string;
  /** App Layout pages this source is scoped to; omitted when global. */
  pageIds?: string[];
  /** Present when source was created from an uploaded file. */
  file?: KnowledgeFileMetadata;
  createdAt: string;
  updatedAt: string;
}

export type KnowledgeChunkKind = 'parent' | 'child';

export interface KnowledgeChunkData {
  id: string;
  projectId: string;
  sourceId: string;
  chunkIndex: number;
  content: string;
  kind?: KnowledgeChunkKind;
  parentChunkId?: string;
  metadata?: KnowledgeChunkMetadata;
}

export interface KnowledgeChunkMetadata {
  headingPath?: string[];
  sourceType?: KnowledgeSourceType;
  /** 1-based PDF page number when chunk came from a paginated document. */
  page?: number;
  /** Source page URL when chunk came from a sitemap crawl. */
  pageUrl?: string;
  /** App Layout page ids when chunk is page-scoped. */
  pageIds?: string[];
}

/** Citation returned with Q&A chat responses for SDK UI. */
export interface QaSourceCitation {
  sourceId: string;
  sourceTitle: string;
  chunkIndex: number;
  excerpt: string;
  score: number;
}

export type KnowledgeRetrievalEmptyReason =
  | 'no_chunks'
  | 'no_candidates'
  | 'below_threshold'
  | 'context_budget_exceeded';

export interface KnowledgeRetrievalLogChunk {
  chunkId: string;
  sourceId: string;
  score: number;
}

export interface KnowledgeRetrievalLog {
  emptyReason?: KnowledgeRetrievalEmptyReason;
  candidateCount: number;
  contextPartCount: number;
  topScore?: number;
  chunks: KnowledgeRetrievalLogChunk[];
  originalQuery?: string;
  searchQuery?: string;
  queryRewritten?: boolean;
  currentPageId?: string;
  pageBoostWeight?: number;
}

export interface KnowledgeRetrieveTestHit {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  chunkIndex: number;
  score: number;
  excerpt: string;
  kind?: KnowledgeChunkKind;
  metadata?: KnowledgeChunkMetadata;
}

export interface KnowledgeRetrieveTestResult {
  query: string;
  emptyReason?: KnowledgeRetrievalEmptyReason;
  hits: KnowledgeRetrieveTestHit[];
  retrievalLog: KnowledgeRetrievalLog;
}
