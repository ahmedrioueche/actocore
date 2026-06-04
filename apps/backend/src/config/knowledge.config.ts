import { KNOWLEDGE_UPLOAD_MAX_BYTES } from '@ahmedrioueche/actocore-shared/constants/knowledge-upload';
import { join } from 'node:path';

export interface KnowledgeResolvedConfig {
  maxUploadBytes: number;
  storagePath: string;
}

export function resolveKnowledgeConfig(): KnowledgeResolvedConfig {
  const maxRaw = process.env.KNOWLEDGE_MAX_UPLOAD_BYTES?.trim();
  const maxUploadBytes = maxRaw
    ? Number(maxRaw)
    : KNOWLEDGE_UPLOAD_MAX_BYTES;

  if (
    !Number.isInteger(maxUploadBytes) ||
    maxUploadBytes < 1024 ||
    maxUploadBytes > 25 * 1024 * 1024
  ) {
    throw new Error(
      'KNOWLEDGE_MAX_UPLOAD_BYTES must be an integer between 1024 and 26214400',
    );
  }

  const storagePath =
    process.env.KNOWLEDGE_STORAGE_PATH?.trim() ||
    join(process.cwd(), '.data', 'knowledge');

  return { maxUploadBytes, storagePath };
}
