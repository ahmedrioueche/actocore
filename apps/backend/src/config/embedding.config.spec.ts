import { resolveEmbeddingConfig } from './embedding.config';

describe('resolveEmbeddingConfig', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.EMBEDDING_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_EMBEDDING_MODEL;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_EMBEDDING_MODEL;
    delete process.env.LLM_PROVIDER;
    process.env.NODE_ENV = 'development';
  });

  afterAll(() => {
    process.env = env;
  });

  it('defaults to stub provider', () => {
    const config = resolveEmbeddingConfig();
    expect(config.provider).toBe('stub');
    expect(config.openai).toBeNull();
    expect(config.google).toBeNull();
  });

  it('requires OPENAI_API_KEY when EMBEDDING_PROVIDER=openai', () => {
    process.env.EMBEDDING_PROVIDER = 'openai';
    expect(() => resolveEmbeddingConfig()).toThrow(/OPENAI_API_KEY/);
  });

  it('resolves OpenAI embeddings independently of LLM_PROVIDER=google', () => {
    process.env.LLM_PROVIDER = 'google';
    process.env.GEMINI_API_KEY = 'gem-key';
    process.env.EMBEDDING_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'sk-embed';

    const config = resolveEmbeddingConfig();
    expect(config.provider).toBe('openai');
    expect(config.openai?.apiKey).toBe('sk-embed');
    expect(config.google).toBeNull();
  });

  it('requires GEMINI_API_KEY when EMBEDDING_PROVIDER=google', () => {
    process.env.EMBEDDING_PROVIDER = 'google';
    expect(() => resolveEmbeddingConfig()).toThrow(/GEMINI_API_KEY/);
  });

  it('resolves Google embeddings from GEMINI_API_KEY', () => {
    process.env.EMBEDDING_PROVIDER = 'google';
    process.env.GEMINI_API_KEY = 'gem-key';
    process.env.GOOGLE_EMBEDDING_MODEL = 'text-embedding-004';

    const config = resolveEmbeddingConfig();
    expect(config.provider).toBe('google');
    expect(config.google).toEqual({
      apiKey: 'gem-key',
      model: 'text-embedding-004',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    });
    expect(config.openai).toBeNull();
  });
});
