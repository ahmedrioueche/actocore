import { describe, expect, it } from 'vitest';

import { parseApiResponse } from '@/lib/parse-api-response';

describe('parseApiResponse', () => {
  it('returns data when success', () => {
    expect(parseApiResponse({ success: true, data: { id: '1' } })).toEqual({
      id: '1',
    });
  });

  it('throws with errorCode when not successful', () => {
    expect(() =>
      parseApiResponse({
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Bad login',
      }),
    ).toThrowError('Bad login');

    try {
      parseApiResponse({ success: false, errorCode: 'INVALID_CREDENTIALS' });
    } catch (e) {
      expect((e as Error & { errorCode?: string }).errorCode).toBe(
        'INVALID_CREDENTIALS',
      );
    }
  });

  it('throws when success but data is missing', () => {
    expect(() => parseApiResponse({ success: true })).toThrowError(
      'API_SUCCESS_MISSING_DATA',
    );
  });
});
