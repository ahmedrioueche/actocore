import * as XLSX from 'xlsx';
import { extractDocxText, extractXlsxText } from './office-document.extractor';

jest.mock('mammoth', () => ({
  convertToHtml: jest.fn(async () => ({
    value:
      '<h1>Product FAQ</h1><p>ActoCore is an AI integration layer.</p><h2>Errors</h2><p>Use ERR-404 for missing workspaces.</p>',
    messages: [],
  })),
}));

describe('office-document.extractor', () => {
  it('extracts markdown text from docx buffers', async () => {
    const text = await extractDocxText(Buffer.from('PK\x03\x04fake-docx'));

    expect(text).toContain('# Product FAQ');
    expect(text).toContain('ActoCore is an AI integration layer');
    expect(text).toContain('ERR-404');
  });

  it('extracts sheet rows from xlsx buffers', () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ['Product', 'Code'],
      ['ActoCore', 'ERR-404'],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Errors');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    const text = extractXlsxText(buffer);

    expect(text).toContain('# Errors');
    expect(text).toContain('Product | Code');
    expect(text).toContain('ActoCore | ERR-404');
  });
});
