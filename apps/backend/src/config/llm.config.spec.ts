import { resolveLlmConfig } from './llm.config';

describe('resolveLlmConfig', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.LLM_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;
    process.env.NODE_ENV = 'development';
  });

  afterAll(() => {
    process.env = env;
  });

  it('defaults to stub provider', () => {
    const config = resolveLlmConfig();
    expect(config.provider).toBe('stub');
    expect(config.openai).toBeNull();
  });

  it('requires OpenAI API key when provider is openai', () => {
    process.env.LLM_PROVIDER = 'openai';
    expect(() => resolveLlmConfig()).toThrow(/OPENAI_API_KEY/);
  });

  it('resolves OpenAI config when key is set', () => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.OPENAI_MODEL = 'gpt-4o';

    const config = resolveLlmConfig();
    expect(config.provider).toBe('openai');
    expect(config.openai).toEqual({
      apiKey: 'sk-test',
      model: 'gpt-4o',
      baseUrl: 'https://api.openai.com/v1',
    });
  });

  it('accepts GEMINI_API_KEY for google provider', () => {
    process.env.LLM_PROVIDER = 'google';
    process.env.GEMINI_API_KEY = 'gem-key';

    const config = resolveLlmConfig();
    expect(config.google?.apiKey).toBe('gem-key');
  });
});
