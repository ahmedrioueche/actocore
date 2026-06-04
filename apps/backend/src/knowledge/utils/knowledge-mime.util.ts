import {
  KNOWLEDGE_ALLOWED_MIME_TYPES,
  KNOWLEDGE_EXTENSION_MIME,
} from '@ahmedrioueche/actocore-shared/constants/knowledge-upload';
import { extname } from 'node:path';

const ALLOWED = new Set<string>(KNOWLEDGE_ALLOWED_MIME_TYPES);

export function resolveKnowledgeMimeType(
  mimeType: string | undefined,
  originalFilename: string,
): string {
  const normalized = (mimeType ?? 'application/octet-stream')
    .split(';')[0]
    .trim()
    .toLowerCase();

  if (ALLOWED.has(normalized)) {
    return normalized;
  }

  const ext = extname(originalFilename).toLowerCase();
  const fromExt = KNOWLEDGE_EXTENSION_MIME[ext];
  if (fromExt && ALLOWED.has(fromExt)) {
    return fromExt;
  }

  throw new Error(
    `Unsupported file type: ${normalized || ext || 'unknown'}. Allowed: PDF, plain text, markdown.`,
  );
}

export function isAllowedKnowledgeMime(mimeType: string): boolean {
  return ALLOWED.has(mimeType.split(';')[0].trim().toLowerCase());
}

export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.subarray(0, 4).toString('utf8') === '%PDF';
}
