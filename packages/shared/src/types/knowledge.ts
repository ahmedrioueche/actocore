export type KnowledgeSourceType = 'text' | 'url' | 'document';

export type KnowledgeSourceStatus = 'pending' | 'ready' | 'error';

export interface KnowledgeSourceData {
  id: string;
  projectId: string;
  type: KnowledgeSourceType;
  title: string;
  url?: string;
  status: KnowledgeSourceStatus;
  chunkCount: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeChunkData {
  id: string;
  projectId: string;
  sourceId: string;
  chunkIndex: number;
  content: string;
}

/** Citation returned with Q&A chat responses for SDK UI. */
export interface QaSourceCitation {
  sourceId: string;
  sourceTitle: string;
  chunkIndex: number;
  excerpt: string;
  score: number;
}
