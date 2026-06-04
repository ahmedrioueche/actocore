import { Injectable } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import { isPdfBuffer } from './utils/knowledge-mime.util';

@Injectable()
export class DocumentTextExtractor {
  async extractText(
    buffer: Buffer,
    mimeType: string,
    originalFilename: string,
  ): Promise<string> {
    const mime = mimeType.toLowerCase();

    if (mime === 'application/pdf' || isPdfBuffer(buffer)) {
      return this.extractPdf(buffer);
    }

    if (
      mime === 'text/plain' ||
      mime === 'text/markdown' ||
      mime === 'text/x-markdown'
    ) {
      return this.extractPlainText(buffer);
    }

    const lower = originalFilename.toLowerCase();
    if (lower.endsWith('.pdf')) {
      return this.extractPdf(buffer);
    }
    if (lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.markdown')) {
      return this.extractPlainText(buffer);
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

  private async extractPdf(buffer: Buffer): Promise<string> {
    const result = await pdfParse(buffer);
    const text = result.text?.trim() ?? '';
    if (!text) {
      throw new Error(
        'PDF contains no extractable text (scanned images require OCR, not supported)',
      );
    }
    return text;
  }
}
