import { describe, expect, it } from 'vitest';
import { useTranslation } from 'react-i18next';
import { renderHook } from '@testing-library/react';

import {
  getApiErrorMessage,
  getMessage,
  getUnknownApiErrorMessage,
} from '@/utils/statusMessage';

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

  it('prefers API validation detail over generic validation copy', () => {
    const { result } = renderHook(() => useTranslation());
    const t = result.current.t;

    expect(
      getApiErrorMessage(t, {
        errorCode: 'VALIDATION_ERROR',
        message:
          'Username must be 2–32 characters: lowercase letters, numbers, underscore, or hyphen.',
      }),
    ).toBe(
      'Username must be 2–32 characters: lowercase letters, numbers, underscore, or hyphen.',
    );
  });

  it('maps plan limit errors with details', () => {
    const { result } = renderHook(() => useTranslation());
    const t = result.current.t;

    expect(
      getApiErrorMessage(t, {
        errorCode: 'PROJECT_LIMIT_REACHED',
        details: { limit: 2, used: 2 },
      }),
    ).toBe(
      "You've reached your project limit (2). Upgrade your plan to add more.",
    );
    expect(
      getApiErrorMessage(t, {
        errorCode: 'SEAT_LIMIT_REACHED',
        details: { limit: 5 },
      }),
    ).toBe(
      "You've reached your team seat limit (5). Upgrade your plan to invite more members.",
    );
    expect(
      getApiErrorMessage(t, {
        errorCode: 'ACTION_LIMIT_REACHED',
        details: { limit: 30, used: 30 },
      }),
    ).toBe(
      "You've reached your action limit (30 per project). Upgrade your plan to create more.",
    );
  });

  it('maps unknown thrown values for billing flows', () => {
    const { result } = renderHook(() => useTranslation());
    const t = result.current.t;

    expect(getUnknownApiErrorMessage(t, new Error('boom'))).toBe('boom');
    expect(getUnknownApiErrorMessage(t, null)).toBe(
      'Something went wrong. Please try again.',
    );
  });
});
