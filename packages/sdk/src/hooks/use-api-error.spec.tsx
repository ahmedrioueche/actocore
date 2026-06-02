import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import type { ReactNode } from 'react';
import { createActocoreI18n } from '../i18n/create-i18n';
import { useApiErrorMessage } from './use-api-error';

const i18n = createActocoreI18n({ locale: 'en' });

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('useApiErrorMessage', () => {
  it('maps known errorCode to i18n message', () => {
    const { result } = renderHook(() => useApiErrorMessage(), {
      wrapper: Wrapper,
    });

    const text = result.current({
      errorCode: 'TOO_MANY_REQUESTS',
      message: 'fallback message',
    });

    expect(text).toBe('Too many requests. Please wait and try again.');
  });

  it('falls back to message when code is unknown', () => {
    const { result } = renderHook(() => useApiErrorMessage(), {
      wrapper: Wrapper,
    });

    const text = result.current({
      errorCode: 'SOMETHING_NEW',
      message: 'custom message',
    });

    expect(text).toBe('custom message');
  });
});

