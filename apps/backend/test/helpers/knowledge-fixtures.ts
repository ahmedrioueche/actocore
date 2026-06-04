import { readFileSync } from 'fs';
import { join } from 'path';

/** W3C dummy PDF — extractable text includes "Dummy PDF file" (pdf-parse compatible). */
export function readKnowledgePdfFixture(): Buffer {
  return readFileSync(join(__dirname, '../fixtures/actocore-knowledge.pdf'));
}
