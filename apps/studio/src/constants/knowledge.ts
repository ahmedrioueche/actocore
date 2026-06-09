import {
  KNOWLEDGE_ALLOWED_MIME_TYPES,
  KNOWLEDGE_EXTENSION_MIME,
  KNOWLEDGE_UPLOAD_MAX_BYTES,
} from '@ahmedrioueche/actocore-shared';

export const KNOWLEDGE_MAX_BYTES = KNOWLEDGE_UPLOAD_MAX_BYTES;

/** Max files per bulk upload on the Knowledge page. */
export const KNOWLEDGE_BULK_UPLOAD_MAX_FILES = 20;

/** Allowed file extensions, derived from the shared extension→mime map. */
export const KNOWLEDGE_ALLOWED_EXTENSIONS = Object.keys(
  KNOWLEDGE_EXTENSION_MIME,
);

/** `accept` attribute for the file input (extensions + mime types). */
export const KNOWLEDGE_ACCEPT = [
  ...KNOWLEDGE_ALLOWED_EXTENSIONS,
  ...KNOWLEDGE_ALLOWED_MIME_TYPES,
].join(',');

const ALLOWED_MIME = new Set<string>(KNOWLEDGE_ALLOWED_MIME_TYPES);

export type KnowledgeFileErrorReason = 'type' | 'size' | 'empty';

export interface KnowledgeFileError {
  reason: KnowledgeFileErrorReason;
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

/**
 * Client-side guardrail mirroring the backend allow list. The backend remains
 * the source of truth (incl. content sniffing); this just gives instant UX.
 */
export function validateKnowledgeFile(file: File): KnowledgeFileError | null {
  if (file.size === 0) {
    return { reason: 'empty' };
  }
  if (file.size > KNOWLEDGE_MAX_BYTES) {
    return { reason: 'size' };
  }

  const mime = (file.type || '').split(';')[0].trim().toLowerCase();
  const ext = getExtension(file.name);
  const mimeOk = mime ? ALLOWED_MIME.has(mime) : false;
  const extOk = ext ? ext in KNOWLEDGE_EXTENSION_MIME : false;

  // Accept when either signal matches; browsers often send empty/octet-stream.
  if (!mimeOk && !extOk) {
    return { reason: 'type' };
  }

  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
