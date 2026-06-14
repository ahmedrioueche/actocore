import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { htmlContentToStructuredText } from './html-readability.util';
import { normalizeKnowledgeText } from './normalize-knowledge-text';

export async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.convertToHtml({ buffer });
  const text = normalizeKnowledgeText(htmlContentToStructuredText(result.value));

  if (!text) {
    throw new Error('Word document contains no extractable text');
  }

  return text;
}

export function extractXlsxText(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sections: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      continue;
    }

    const rows = XLSX.utils.sheet_to_json<(string | number | boolean)[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    });

    const lines: string[] = [`# ${sheetName}`];

    for (const row of rows) {
      const cells = row
        .map((cell) => String(cell ?? '').trim())
        .filter(Boolean);

      if (cells.length > 0) {
        lines.push(cells.join(' | '));
      }
    }

    if (lines.length > 1) {
      sections.push(lines.join('\n'));
    }
  }

  const text = normalizeKnowledgeText(sections.join('\n\n'));

  if (!text) {
    throw new Error('Excel workbook contains no extractable text');
  }

  return text;
}
