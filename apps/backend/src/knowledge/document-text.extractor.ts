import { Injectable } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import type {
  DocumentExtractionResult,
  DocumentPageText,
} from './document-extraction.types';
import { normalizeKnowledgeText } from './utils/normalize-knowledge-text';
import { isPdfBuffer } from './utils/knowledge-mime.util';
import {
  extractDocxText,
  extractXlsxText,
} from './utils/office-document.extractor';

type PdfPageData = {
  getTextContent: (options?: {
    normalizeWhitespace?: boolean;
    disableCombineTextItems?: boolean;
  }) => Promise<{ items: Array<{ str: string; transform: number[] }> }>;
};

type PdfParseFn = (
  buffer: Buffer,
  options?: {
    pagerender?: (pageData: PdfPageData) => Promise<string>;
  },
) => Promise<{ text?: string; numpages: number }>;

const parsePdf = pdfParse as unknown as PdfParseFn;

@Injectable()
export class DocumentTextExtractor {
  async extractText(
    buffer: Buffer,
    mimeType: string,
    originalFilename: string,
  ): Promise<string> {
    const result = await this.extractDocument(buffer, mimeType, originalFilename);
    return result.text;
  }

  async extractDocument(
    buffer: Buffer,
    mimeType: string,
    originalFilename: string,
  ): Promise<DocumentExtractionResult> {
    const mime = mimeType.toLowerCase();
    const lower = originalFilename.toLowerCase();

    if (mime === 'application/pdf' || isPdfBuffer(buffer)) {
      return this.extractPdf(buffer);
    }

    if (
      mime === 'text/plain' ||
      mime === 'text/markdown' ||
      mime === 'text/x-markdown'
    ) {
      return { text: this.extractPlainText(buffer) };
    }

    if (
      mime ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      lower.endsWith('.docx')
    ) {
      return { text: await extractDocxText(buffer) };
    }

    if (
      mime ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      lower.endsWith('.xlsx')
    ) {
      return { text: extractXlsxText(buffer) };
    }

    if (lower.endsWith('.pdf')) {
      return this.extractPdf(buffer);
    }
    if (lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.markdown')) {
      return { text: this.extractPlainText(buffer) };
    }

    throw new Error(`No extractor for MIME type: ${mimeType}`);
  }

  private extractPlainText(buffer: Buffer): string {
    const text = buffer.toString('utf8').trim();
    if (!text) {
      throw new Error('File contains no readable text');
    }
    return text;
  }

  private async extractPdf(buffer: Buffer): Promise<DocumentExtractionResult> {
    const pages: DocumentPageText[] = [];
    let pageNumber = 0;

    const result = await parsePdf(buffer, {
      pagerender: async (pageData: PdfPageData) => {
        pageNumber += 1;
        const rawText = await renderPdfPageText(pageData);
        const text = normalizeKnowledgeText(rawText);

        if (text) {
          pages.push({ page: pageNumber, text });
        }

        return rawText;
      },
    });

    const text =
      pages.length > 0
        ? pages.map((entry) => entry.text).join('\n\n')
        : normalizeKnowledgeText(result.text?.trim() ?? '');

    if (!text) {
      throw new Error(
        'PDF contains no extractable text (scanned images require OCR, not supported)',
      );
    }

    return {
      text,
      pages: pages.length > 0 ? pages : [{ page: 1, text }],
    };
  }
}

async function renderPdfPageText(pageData: PdfPageData): Promise<string> {
  const textContent = await pageData.getTextContent({
    normalizeWhitespace: false,
    disableCombineTextItems: false,
  });

  let lastY: number | undefined;
  let text = '';

  for (const item of textContent.items) {
    if (lastY === item.transform[5] || lastY === undefined) {
      text += item.str;
    } else {
      text += `\n${item.str}`;
    }
    lastY = item.transform[5];
  }

  return text;
}
