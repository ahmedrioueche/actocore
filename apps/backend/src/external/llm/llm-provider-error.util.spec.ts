import { summarizeLlmErrorBody } from './llm-provider-error.util';

describe('summarizeLlmErrorBody', () => {
  it('extracts Gemini-style error message', () => {
    const body = JSON.stringify({
      error: {
        code: 429,
        message: 'Resource exhausted. Please try again later.',
        status: 'RESOURCE_EXHAUSTED',
      },
    });
    expect(summarizeLlmErrorBody(body)).toContain('Resource exhausted');
  });

  it('returns trimmed raw text when not JSON', () => {
    expect(summarizeLlmErrorBody('rate limited')).toBe('rate limited');
  });

  it('returns empty for blank body', () => {
    expect(summarizeLlmErrorBody('   ')).toBe('');
  });
});
