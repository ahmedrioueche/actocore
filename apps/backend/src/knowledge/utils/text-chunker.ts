export interface TextChunk {
  index: number;
  content: string;
}

export function chunkText(
  text: string,
  options?: { maxChars?: number; overlap?: number },
): TextChunk[] {
  const maxChars = options?.maxChars ?? 800;
  const overlap = options?.overlap ?? 100;
  const normalized = text.replace(/\r\n/g, '\n').trim();

  if (!normalized) {
    return [];
  }

  if (normalized.length <= maxChars) {
    return [{ index: 0, content: normalized }];
  }

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < normalized.length) {
    const end = Math.min(start + maxChars, normalized.length);
    const content = normalized.slice(start, end).trim();

    if (content) {
      chunks.push({ index, content });
      index += 1;
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(0, end - overlap);
  }

  return chunks;
}
