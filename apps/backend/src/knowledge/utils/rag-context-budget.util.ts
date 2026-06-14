import { estimateTokensFromText } from '../../usage/utils/usage-export.util';

export interface RagContextPartCandidate {
  score: number;
  chunkId: string;
  sourceId: string;
  format: (index: number) => string;
}

export function readContextMaxTokens(): number {
  const raw = process.env.RAG_CONTEXT_MAX_TOKENS?.trim();
  if (!raw) {
    return 4000;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 4000;
}

/** Keeps highest-scoring parts first until the token budget is reached, then renumbers [1]..[n]. */
export function applyContextTokenBudget(
  candidates: RagContextPartCandidate[],
  maxTokens: number,
): { parts: string[]; droppedByBudget: boolean } {
  if (candidates.length === 0) {
    return { parts: [], droppedByBudget: false };
  }

  const ordered = [...candidates].sort((a, b) => b.score - a.score);
  const selected: RagContextPartCandidate[] = [];
  let usedTokens = 0;

  for (const candidate of ordered) {
    const preview = candidate.format(selected.length);
    const tokens = estimateTokensFromText(preview.length);

    if (selected.length === 0 && tokens > maxTokens) {
      return { parts: [], droppedByBudget: true };
    }

    if (usedTokens + tokens > maxTokens) {
      continue;
    }

    selected.push(candidate);
    usedTokens += tokens;
  }

  if (selected.length === 0) {
    return { parts: [], droppedByBudget: true };
  }

  const droppedByBudget = selected.length < ordered.length;
  const parts = selected.map((candidate, index) => candidate.format(index));

  return { parts, droppedByBudget };
}
