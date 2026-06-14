import 'reflect-metadata';
import {
  assertSafeKnowledgeContent,
  isAllowedKnowledgeMime,
  isOfficeOpenXmlBuffer,
  isPdfBuffer,
  MaliciousKnowledgeContentError,
  resolveKnowledgeMimeType,
  UnsupportedKnowledgeFileError,
} from './knowledge-mime.util';

describe('knowledge-mime.util', () => {
  it('resolves PDF from extension when mime is octet-stream', () => {
    expect(
      resolveKnowledgeMimeType('application/octet-stream', 'manual.pdf'),
    ).toBe('application/pdf');
  });

  it('resolves DOCX from extension when mime is octet-stream', () => {
    expect(
      resolveKnowledgeMimeType('application/octet-stream', 'guide.docx'),
    ).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  });

  it('resolves XLSX from extension when mime is octet-stream', () => {
    expect(
      resolveKnowledgeMimeType('application/octet-stream', 'pricing.xlsx'),
    ).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });

  it('rejects unknown types', () => {
    expect(() =>
      resolveKnowledgeMimeType('application/zip', 'archive.zip'),
    ).toThrow(UnsupportedKnowledgeFileError);
  });

  it('detects PDF magic bytes', () => {
    expect(isPdfBuffer(Buffer.from('%PDF-1.4'))).toBe(true);
    expect(isPdfBuffer(Buffer.from('hello'))).toBe(false);
  });

  it('detects Office Open XML zip signatures', () => {
    expect(isOfficeOpenXmlBuffer(Buffer.from([0x50, 0x4b, 0x03, 0x04]))).toBe(
      true,
    );
    expect(isOfficeOpenXmlBuffer(Buffer.from('hello'))).toBe(false);
  });

  it('allows known mime types', () => {
    expect(isAllowedKnowledgeMime('text/plain')).toBe(true);
    expect(isAllowedKnowledgeMime('application/pdf')).toBe(true);
  });

  describe('assertSafeKnowledgeContent', () => {
    it('accepts a real PDF', () => {
      expect(() =>
        assertSafeKnowledgeContent(Buffer.from('%PDF-1.7\n...'), 'application/pdf'),
      ).not.toThrow();
    });

    it('rejects a PDF with a spoofed signature', () => {
      expect(() =>
        assertSafeKnowledgeContent(Buffer.from('MZ\x90\x00not-a-pdf'), 'application/pdf'),
      ).toThrow(MaliciousKnowledgeContentError);
    });

    it('accepts plain text', () => {
      expect(() =>
        assertSafeKnowledgeContent(Buffer.from('hello world'), 'text/plain'),
      ).not.toThrow();
    });

    it('accepts Office Open XML signatures for docx/xlsx', () => {
      const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);

      expect(() =>
        assertSafeKnowledgeContent(
          zipHeader,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ),
      ).not.toThrow();

      expect(() =>
        assertSafeKnowledgeContent(
          zipHeader,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ),
      ).not.toThrow();
    });

    it('rejects binary content disguised as text', () => {
      expect(() =>
        assertSafeKnowledgeContent(
          Buffer.from([0x48, 0x00, 0x49, 0x00]),
          'text/plain',
        ),
      ).toThrow(MaliciousKnowledgeContentError);
    });

    it('rejects empty files', () => {
      expect(() =>
        assertSafeKnowledgeContent(Buffer.alloc(0), 'text/plain'),
      ).toThrow(MaliciousKnowledgeContentError);
    });
  });
});
