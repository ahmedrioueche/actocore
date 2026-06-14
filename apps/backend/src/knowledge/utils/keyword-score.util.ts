const TOKEN_MIN_LENGTH = 2;

export function tokenizeForKeywordSearch(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= TOKEN_MIN_LENGTH);
}

/** Normalized 0–1 score: share of query tokens found in content. */
export function keywordScore(query: string, content: string): number {
  const queryTokens = tokenizeForKeywordSearch(query);
  if (queryTokens.length === 0) {
    return 0;
  }

  const contentLower = content.toLowerCase();
  let hits = 0;

  for (const token of queryTokens) {
    if (contentLower.includes(token)) {
      hits += 1;
    }
  }

  return hits / queryTokens.length;
}

export function readHybridKeywordWeight(): number {
  const raw = process.env.RAG_HYBRID_KEYWORD_WEIGHT?.trim();
  if (!raw) {
    return 0.3;
  }

  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return 0.3;
  }

  return parsed;
}
