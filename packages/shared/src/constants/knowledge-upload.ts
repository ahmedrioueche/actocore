/** Max upload size for knowledge files (10 MiB). */
export const KNOWLEDGE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export const KNOWLEDGE_UPLOAD_FIELD_NAME = 'file';

/** MIME types accepted by Core knowledge upload. */
export const KNOWLEDGE_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
] as const;

export type KnowledgeAllowedMimeType =
  (typeof KNOWLEDGE_ALLOWED_MIME_TYPES)[number];

/** Fallback when clients send `application/octet-stream`. */
export const KNOWLEDGE_EXTENSION_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.markdown': 'text/markdown',
};
