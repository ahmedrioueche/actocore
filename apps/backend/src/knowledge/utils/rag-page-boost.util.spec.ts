import {
  applyPageBoostScore,
  readPageBoostWeight,
} from './rag-page-boost.util';

describe('rag-page-boost.util', () => {
  it('adds boost when chunk is scoped to the current page', () => {
    expect(
      applyPageBoostScore(0.5, ['page-a', 'page-b'], 'page-a', 0.15),
    ).toBeCloseTo(0.65);
  });

  it('does not boost global chunks or when page is unset', () => {
    expect(applyPageBoostScore(0.5, undefined, 'page-a', 0.15)).toBe(0.5);
    expect(applyPageBoostScore(0.5, ['page-b'], 'page-a', 0.15)).toBe(0.5);
    expect(applyPageBoostScore(0.5, ['page-a'], undefined, 0.15)).toBe(0.5);
  });

  it('reads boost weight from env with fallback', () => {
    const original = process.env.RAG_PAGE_BOOST;
    process.env.RAG_PAGE_BOOST = '0.2';
    expect(readPageBoostWeight()).toBe(0.2);
    delete process.env.RAG_PAGE_BOOST;
    expect(readPageBoostWeight()).toBe(0.15);
    if (original !== undefined) {
      process.env.RAG_PAGE_BOOST = original;
    }
  });
});
