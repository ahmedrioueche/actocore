import { CohereRerankProvider } from './cohere-rerank.provider';

jest.mock('../../external/llm/llm-http', () => ({
  postJson: jest.fn(),
  LlmHttpError: class LlmHttpError extends Error {},
}));

import { postJson } from '../../external/llm/llm-http';

describe('CohereRerankProvider', () => {
  const provider = new CohereRerankProvider('test-key', 5_000, 'rerank-english-v3.0');

  beforeEach(() => {
    jest.mocked(postJson).mockReset();
  });

  it('maps Cohere relevance scores back to document ids', async () => {
    jest.mocked(postJson).mockResolvedValue({
      results: [
        { index: 1, relevance_score: 0.91 },
        { index: 0, relevance_score: 0.42 },
      ],
    });

    const results = await provider.rerank(
      'billing invoices',
      [
        { id: 'a', text: 'General product overview.' },
        { id: 'b', text: 'Monthly invoices are sent on the first.' },
      ],
      2,
    );

    expect(results).toEqual([
      { id: 'b', score: 0.91 },
      { id: 'a', score: 0.42 },
    ]);
    expect(postJson).toHaveBeenCalledWith(
      'https://api.cohere.com/v1/rerank',
      expect.objectContaining({
        body: expect.objectContaining({
          query: 'billing invoices',
          top_n: 2,
        }),
      }),
    );
  });
});
