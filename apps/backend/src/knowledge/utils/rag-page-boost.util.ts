const DEFAULT_PAGE_BOOST = 0.15;

export function readPageBoostWeight(): number {
  const raw = process.env.RAG_PAGE_BOOST?.trim();
  if (!raw) {
    return DEFAULT_PAGE_BOOST;
  }

  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_PAGE_BOOST;
  }

  return parsed;
}

export function applyPageBoostScore(
  score: number,
  pageIds: string[] | undefined,
  currentPageId: string | undefined,
  boostWeight: number,
): number {
  if (!currentPageId || boostWeight <= 0 || !pageIds?.includes(currentPageId)) {
    return score;
  }

  return score + boostWeight;
}
