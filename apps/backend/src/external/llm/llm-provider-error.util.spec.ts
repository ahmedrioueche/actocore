import { Logger } from '@nestjs/common';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { LlmHttpError } from './llm-http';
import { mapLlmProviderError, summarizeLlmErrorBody } from './llm-provider-error.util';

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

describe('mapLlmProviderError', () => {
  const logger = { warn: jest.fn() } as unknown as Logger;

  it('maps provider 503 to SERVICE_UNAVAILABLE without leaking details', () => {
    const err = mapLlmProviderError(
      'Gemini',
      new LlmHttpError(
        503,
        JSON.stringify({
          error: { message: 'This model is currently experiencing high demand.' },
        }),
      ),
      logger,
    );

    const response = err.getResponse() as { errorCode: string; message: string };
    expect(response.errorCode).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    expect(response.message).not.toContain('Gemini');
    expect(response.message).not.toContain('high demand');
  });
});
