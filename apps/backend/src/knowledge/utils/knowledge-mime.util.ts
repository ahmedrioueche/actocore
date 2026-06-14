import {
  KNOWLEDGE_ALLOWED_MIME_TYPES,
  KNOWLEDGE_EXTENSION_MIME,
} from '@ahmedrioueche/actocore-shared/constants/knowledge-upload';
import { extname } from 'node:path';

const ALLOWED = new Set<string>(KNOWLEDGE_ALLOWED_MIME_TYPES);

/** Thrown when a file's declared/derived type is not in the allow list. */
export class UnsupportedKnowledgeFileError extends Error {}

/** Thrown when file bytes do not match the declared type (possible spoofing). */
export class MaliciousKnowledgeContentError extends Error {}

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

  throw new UnsupportedKnowledgeFileError(
    `Unsupported file type: ${normalized || ext || 'unknown'}. Allowed: PDF, plain text, markdown, Word (.docx), Excel (.xlsx).`,
  );
}

export function isAllowedKnowledgeMime(mimeType: string): boolean {
  return ALLOWED.has(mimeType.split(';')[0].trim().toLowerCase());
}

export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.subarray(0, 4).toString('utf8') === '%PDF';
}

/** DOCX and XLSX are ZIP containers (PK header). */
export function isOfficeOpenXmlBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
    (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08)
  );
}

/**
 * Heuristic binary detection: text/markdown files should not contain NUL bytes.
 * Catches executables or archives renamed with a .txt/.md extension.
 */
function looksBinary(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
  return sample.includes(0x00);
}

/**
 * Verifies the actual bytes match the resolved MIME type. Throws
 * {@link MaliciousKnowledgeContentError} when a spoofed file is detected.
 */
export function assertSafeKnowledgeContent(
  buffer: Buffer,
  mimeType: string,
): void {
  if (!buffer?.length) {
    throw new MaliciousKnowledgeContentError('File is empty.');
  }

  if (mimeType === 'application/pdf') {
    if (!isPdfBuffer(buffer)) {
      throw new MaliciousKnowledgeContentError(
        'File is not a valid PDF (signature mismatch).',
      );
    }
    return;
  }

  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    if (!isOfficeOpenXmlBuffer(buffer)) {
      throw new MaliciousKnowledgeContentError(
        'File is not a valid Office document (signature mismatch).',
      );
    }
    return;
  }

  // Remaining allowed types are text based.
  if (looksBinary(buffer)) {
    throw new MaliciousKnowledgeContentError(
      'File appears to be binary, not text.',
    );
  }
}
