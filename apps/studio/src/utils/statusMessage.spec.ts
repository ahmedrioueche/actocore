import { describe, expect, it } from 'vitest';
import { useTranslation } from 'react-i18next';
import { renderHook } from '@testing-library/react';

import { getApiErrorMessage, getMessage } from '@/utils/statusMessage';

describe('statusMessage', () => {
  it('maps known error codes via i18n', () => {
    const { result } = renderHook(() => useTranslation());
    const t = result.current.t;

    expect(getMessage(t, 'INVALID_CREDENTIALS')).toBe(
      'Invalid email, workspace, username, or password.',
    );
    expect(getMessage(t, 'EMAIL_NOT_VERIFIED')).toBe(
      'Please verify your email before signing in.',
    );
  });

  it('falls back to API message then generic', () => {
    const { result } = renderHook(() => useTranslation());
    const t = result.current.t;

    expect(getApiErrorMessage(t, { message: 'Server said no' })).toBe(
      'Server said no',
    );
    expect(getApiErrorMessage(t, {})).toBe(
      'Something went wrong. Please try again.',
    );
  });
});
