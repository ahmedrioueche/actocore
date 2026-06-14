import { readFileSync } from 'fs';
import { join } from 'path';
import { DocumentTextExtractor } from './document-text.extractor';

describe('DocumentTextExtractor', () => {
  const extractor = new DocumentTextExtractor();

  it('extracts plain text', async () => {
    const text = await extractor.extractText(
      Buffer.from('Hello from a knowledge file.'),
      'text/plain',
      'notes.txt',
    );
    expect(text).toBe('Hello from a knowledge file.');
  });

  it('extracts markdown as text', async () => {
    const text = await extractor.extractText(
      Buffer.from('# Title\n\nBody copy.'),
      'text/markdown',
      'readme.md',
    );
    expect(text).toContain('Body copy');
  });

  it('extracts text from the knowledge e2e PDF fixture', async () => {
    const buffer = readFileSync(
      join(__dirname, '../../test/fixtures/actocore-knowledge.pdf'),
    );
    const text = await extractor.extractText(
      buffer,
      'application/pdf',
      'actocore-knowledge.pdf',
    );
    expect(text).toContain('Dummy PDF');
  });

  it('extractDocument returns per-page text for PDFs', async () => {
    const buffer = readFileSync(
      join(__dirname, '../../test/fixtures/actocore-knowledge.pdf'),
    );
    const result = await extractor.extractDocument(
      buffer,
      'application/pdf',
      'actocore-knowledge.pdf',
    );

    expect(result.text).toContain('Dummy PDF');
    expect(result.pages).toEqual([
      expect.objectContaining({ page: 1, text: expect.stringContaining('Dummy PDF') }),
    ]);
  });
});
