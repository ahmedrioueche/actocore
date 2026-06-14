import { LlmHttpError } from '../../external/llm/llm-http';
import { GoogleEmbeddingProvider } from './google-embedding.provider';

jest.mock('../../external/llm/llm-http', () => ({
  LlmHttpError: class LlmHttpError extends Error {
    constructor(
      readonly status: number,
      readonly responseBody: string,
    ) {
      super(`LLM request failed (${status})`);
    }
  },
  postJson: jest.fn(),
}));

import { postJson } from '../../external/llm/llm-http';

const postJsonMock = postJson as jest.MockedFunction<typeof postJson>;

describe('GoogleEmbeddingProvider', () => {
  const config = {
    apiKey: 'gem-key',
    model: 'text-embedding-004',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  };

  beforeEach(() => {
    postJsonMock.mockReset();
  });

  it('embeds a single text via embedContent', async () => {
    postJsonMock.mockResolvedValue({
      embedding: { values: [0.1, 0.2, 0.3] },
    });

    const provider = new GoogleEmbeddingProvider(config, 5000);
    const vector = await provider.embed('hello world');

    expect(vector).toEqual([0.1, 0.2, 0.3]);
    expect(postJsonMock).toHaveBeenCalledTimes(1);
    expect(postJsonMock.mock.calls[0]?.[0]).toContain('embedContent');
    expect(postJsonMock.mock.calls[0]?.[0]).toContain('key=gem-key');
  });

  it('batch embeds via batchEmbedContents', async () => {
    postJsonMock.mockResolvedValue({
      embeddings: [{ values: [1] }, { values: [2] }],
    });

    const provider = new GoogleEmbeddingProvider(config, 5000);
    const vectors = await provider.embedBatch(['a', 'b']);

    expect(vectors).toEqual([[1], [2]]);
    expect(postJsonMock.mock.calls[0]?.[0]).toContain('batchEmbedContents');
  });

  it('throws when Gemini returns empty values', async () => {
    postJsonMock.mockResolvedValue({ embedding: { values: [] } });

    const provider = new GoogleEmbeddingProvider(config, 5000);
    await expect(provider.embed('hello')).rejects.toBeInstanceOf(LlmHttpError);
  });
});
