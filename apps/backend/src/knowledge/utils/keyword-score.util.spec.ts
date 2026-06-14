import {
  keywordScore,
  readHybridKeywordWeight,
  tokenizeForKeywordSearch,
} from './keyword-score.util';

describe('keyword-score.util', () => {
  it('scores exact token overlap', () => {
    expect(
      keywordScore('invoice billing', 'Monthly invoice billing details'),
    ).toBe(1);
  });

  it('tokenizes query terms', () => {
    expect(tokenizeForKeywordSearch('ERR-404: not found')).toEqual([
      'err',
      '404',
      'not',
      'found',
    ]);
  });

  it('defaults hybrid keyword weight to 0.3', () => {
    const original = process.env.RAG_HYBRID_KEYWORD_WEIGHT;
    delete process.env.RAG_HYBRID_KEYWORD_WEIGHT;
    expect(readHybridKeywordWeight()).toBe(0.3);
    if (original === undefined) {
      delete process.env.RAG_HYBRID_KEYWORD_WEIGHT;
    } else {
      process.env.RAG_HYBRID_KEYWORD_WEIGHT = original;
    }
  });
});
