export const KNOWLEDGE_INGEST_QUEUE = 'knowledge:ingest';

export interface KnowledgeIngestJobData {
  sourceId: string;
  projectId: string;
  /** Optional on enqueue; text sources fall back to persisted `textContent`. */
  content?: string;
}
