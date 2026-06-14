import {
  applyContextTokenBudget,
  type RagContextPartCandidate,
} from './rag-context-budget.util';

function candidate(
  score: number,
  id: string,
  charCount: number,
): RagContextPartCandidate {
  const body = 'x'.repeat(charCount);
  return {
    score,
    chunkId: id,
    sourceId: 'source-1',
    format: (index) => `[${index + 1}] Section ${id}\n${body}`,
  };
}

describe('applyContextTokenBudget', () => {
  it('keeps all parts when under budget', () => {
    const result = applyContextTokenBudget(
      [candidate(0.9, 'a', 40), candidate(0.5, 'b', 40)],
      4000,
    );

    expect(result.parts).toHaveLength(2);
    expect(result.parts[0]).toMatch(/^\[1\]/);
    expect(result.parts[1]).toMatch(/^\[2\]/);
    expect(result.droppedByBudget).toBe(false);
  });

  it('drops lowest-scoring parts when over budget', () => {
    const result = applyContextTokenBudget(
      [
        candidate(0.9, 'high', 1200),
        candidate(0.3, 'low', 1200),
        candidate(0.6, 'mid', 1200),
      ],
      500,
    );

    expect(result.parts).toHaveLength(1);
    expect(result.parts[0]).toContain('high');
    expect(result.droppedByBudget).toBe(true);
  });

  it('returns empty when the best part alone exceeds budget', () => {
    const result = applyContextTokenBudget([candidate(0.9, 'only', 8000)], 100);

    expect(result.parts).toHaveLength(0);
    expect(result.droppedByBudget).toBe(true);
  });

  it('renumbers surviving parts sequentially', () => {
    const result = applyContextTokenBudget(
      [candidate(0.9, 'first', 40), candidate(0.1, 'second', 1200)],
      100,
    );

    expect(result.parts).toHaveLength(1);
    expect(result.parts[0]).toMatch(/^\[1\] Section first/);
  });
});
