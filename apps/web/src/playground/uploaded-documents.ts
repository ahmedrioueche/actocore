import type { PlaygroundUploadedDocument } from './types';

const STORAGE_PREFIX = 'actocore-playground-uploads:';
const MAX_UPLOADS = 2;
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_CONTENT_CHARS = 12_000;

const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.markdown']);

export function getMaxPlaygroundUploads(): number {
  return MAX_UPLOADS;
}

export function loadUploadedDocuments(visitorId: string): PlaygroundUploadedDocument[] {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${visitorId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PlaygroundUploadedDocument[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_UPLOADS) : [];
  } catch {
    return [];
  }
}

export function saveUploadedDocuments(
  visitorId: string,
  documents: PlaygroundUploadedDocument[],
): void {
  sessionStorage.setItem(
    `${STORAGE_PREFIX}${visitorId}`,
    JSON.stringify(documents.slice(0, MAX_UPLOADS)),
  );
}

function extension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

export type ReadUploadFileResult =
  | { ok: true; document: PlaygroundUploadedDocument }
  | { ok: false; errorKey: 'tooLarge' | 'unsupportedType' | 'empty' | 'readFailed' };

export async function readUploadFile(file: File): Promise<ReadUploadFileResult> {
  if (file.size > MAX_BYTES) {
    return { ok: false, errorKey: 'tooLarge' };
  }

  const ext = extension(file.name);
  if (!TEXT_EXTENSIONS.has(ext)) {
    return { ok: false, errorKey: 'unsupportedType' };
  }

  try {
    const text = await file.text();
    const content = text.trim();
    if (!content) {
      return { ok: false, errorKey: 'empty' };
    }

    return {
      ok: true,
      document: {
        id: crypto.randomUUID(),
        name: file.name,
        mimeType: file.type || 'text/plain',
        size: file.size,
        content: content.slice(0, MAX_CONTENT_CHARS),
      },
    };
  } catch {
    return { ok: false, errorKey: 'readFailed' };
  }
}

export function toHostContextDocuments(
  documents: PlaygroundUploadedDocument[],
): Array<{ name: string; content: string }> {
  return documents.map((doc) => ({
    name: doc.name,
    content: doc.content.slice(0, MAX_CONTENT_CHARS),
  }));
}
