import type { DocumentExtractionResult } from './document-extraction.types';
import { DocumentTextExtractor } from './document-text.extractor';
import {
  extractReadableHtmlText,
  looksLikeHtml,
} from './utils/html-readability.util';
import { isPdfBuffer } from './utils/knowledge-mime.util';

export interface FetchUrlContentOptions {
  timeoutMs?: number;
}

export async function fetchUrlContent(
  url: string,
  documentText: DocumentTextExtractor,
  options: FetchUrlContentOptions = {},
): Promise<DocumentExtractionResult> {
  const timeoutMs = options.timeoutMs ?? 15_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch URL (${response.status})`);
    }

    const contentType =
      response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ??
      '';

    const buffer = Buffer.from(await response.arrayBuffer());

    if (contentType.includes('pdf') || isPdfBuffer(buffer)) {
      return documentText.extractDocument(buffer, 'application/pdf', 'remote.pdf');
    }

    const asText = buffer.toString('utf8');
    if (contentType.includes('html') || looksLikeHtml(asText)) {
      return { text: extractReadableHtmlText(asText, url) };
    }

    return { text: asText.trim() };
  } finally {
    clearTimeout(timer);
  }
}
