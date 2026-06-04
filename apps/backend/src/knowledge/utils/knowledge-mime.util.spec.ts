import 'reflect-metadata';
import {
  isAllowedKnowledgeMime,
  isPdfBuffer,
  resolveKnowledgeMimeType,
} from './knowledge-mime.util';

describe('knowledge-mime.util', () => {
  it('resolves PDF from extension when mime is octet-stream', () => {
    expect(
      resolveKnowledgeMimeType('application/octet-stream', 'manual.pdf'),
    ).toBe('application/pdf');
  });

  it('rejects unknown types', () => {
    expect(() =>
      resolveKnowledgeMimeType('application/zip', 'archive.zip'),
    ).toThrow(/Unsupported file type/);
  });

  it('detects PDF magic bytes', () => {
    expect(isPdfBuffer(Buffer.from('%PDF-1.4'))).toBe(true);
    expect(isPdfBuffer(Buffer.from('hello'))).toBe(false);
  });

  it('allows known mime types', () => {
    expect(isAllowedKnowledgeMime('text/plain')).toBe(true);
    expect(isAllowedKnowledgeMime('application/pdf')).toBe(true);
  });
});
