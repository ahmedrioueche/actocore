const ORPHAN_BULLET_LINE = /^\s*[•·▪●○◦\-–—*]\s*$/;
const ORPHAN_NUMBER_LINE = /^\s*\d+\s*$/;

/** Strip PDF/list extraction noise before chunking or displaying excerpts. */
export function normalizeKnowledgeText(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const cleaned: string[] = [];

  for (const line of lines) {
    if (ORPHAN_BULLET_LINE.test(line) || ORPHAN_NUMBER_LINE.test(line)) {
      continue;
    }

    const trimmed = line.replace(/[^\S\n]+/g, ' ').trim();
    if (trimmed) {
      cleaned.push(trimmed);
    }
  }

  return cleaned.join('\n').trim();
}

export function truncateKnowledgeExcerpt(text: string, max: number): string {
  const normalized = normalizeKnowledgeText(text);
  if (normalized.length <= max) {
    return normalized;
  }

  const slice = normalized.slice(0, max);
  const lastBreak = Math.max(slice.lastIndexOf('\n'), slice.lastIndexOf(' '));
  const cut =
    lastBreak > max * 0.55 ? slice.slice(0, lastBreak) : slice.slice(0, max);

  return `${cut.trim()}…`;
}
