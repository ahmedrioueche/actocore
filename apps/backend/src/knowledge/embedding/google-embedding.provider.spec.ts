import { LlmHttpError } from '../../external/llm/llm-http';
import {
  GoogleEmbeddingProvider,
  toGoogleEmbeddingModelResource,
  toGoogleEmbeddingModelSlug,
} from './google-embedding.provider';

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

describe('google embedding model helpers', () => {
  it('maps model config to resource and URL slug forms', () => {
    expect(toGoogleEmbeddingModelResource('gemini-embedding-001')).toBe(
      'models/gemini-embedding-001',
    );
    expect(toGoogleEmbeddingModelSlug('models/gemini-embedding-001')).toBe(
      'gemini-embedding-001',
    );
  });
});

describe('GoogleEmbeddingProvider', () => {
  const config = {
    apiKey: 'gem-key',
    model: 'gemini-embedding-001',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  };

  beforeEach(() => {
    postJsonMock.mockReset();
  });

  it('embeds a single text via embedContent with correct URL', async () => {
    postJsonMock.mockResolvedValue({
      embedding: { values: [0.1, 0.2, 0.3] },
    });

    const provider = new GoogleEmbeddingProvider(config, 5000);
    const vector = await provider.embed('hello world');

    expect(vector).toEqual([0.1, 0.2, 0.3]);
    expect(postJsonMock).toHaveBeenCalledTimes(1);

    const [url, options] = postJsonMock.mock.calls[0]!;
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=gem-key',
    );
    expect(url).not.toContain('models%2F');
    expect(options.body).toEqual({
      model: 'models/gemini-embedding-001',
      content: { parts: [{ text: 'hello world' }] },
      taskType: 'RETRIEVAL_DOCUMENT',
    });
  });

  it('batch embeds via batchEmbedContents with correct URL', async () => {
    postJsonMock.mockResolvedValue({
      embeddings: [{ values: [1] }, { values: [2] }],
    });

    const provider = new GoogleEmbeddingProvider(config, 5000);
    const vectors = await provider.embedBatch(['a', 'b']);

    expect(vectors).toEqual([[1], [2]]);

    const [url] = postJsonMock.mock.calls[0]!;
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=gem-key',
    );
    expect(url).not.toContain('models%2F');
  });

  it('throws when Gemini returns empty values', async () => {
    postJsonMock.mockResolvedValue({ embedding: { values: [] } });

    const provider = new GoogleEmbeddingProvider(config, 5000);
    await expect(provider.embed('hello')).rejects.toBeInstanceOf(LlmHttpError);
  });
});
