/**
 * Regenerate test/fixtures/actocore-knowledge.pdf (W3C dummy PDF, pdf-parse compatible).
 * Run from apps/backend: node scripts/gen-minimal-pdf.mjs
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, '../test/fixtures');
const out = join(dir, 'actocore-knowledge.pdf');

const url =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

mkdirSync(dir, { recursive: true });

const response = await fetch(url);
if (!response.ok) {
  console.error('Failed to download fixture PDF:', response.status);
  process.exit(1);
}

const pdf = Buffer.from(await response.arrayBuffer());
const pdfParse = (await import('pdf-parse')).default;
const result = await pdfParse(pdf);
const text = result.text?.trim() ?? '';
if (!text.includes('Dummy PDF')) {
  console.error('Unexpected PDF text:', text);
  process.exit(1);
}

writeFileSync(out, pdf);
console.log('Wrote', out);
