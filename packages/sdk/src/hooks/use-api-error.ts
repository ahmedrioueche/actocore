import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApiResponse } from '@ahmedrioueche/actocore-shared';

type ApiErrorLike = Pick<ApiResponse<unknown>, 'errorCode' | 'message'>;

/**
 * Turns `ApiResponse` failures (and other unknown errors) into i18n messages.
 * Core returns error codes through `errorCode`; we map them to `errors.<code>`.
 */
export function useApiErrorMessage() {
  const { t } = useTranslation();

  return useCallback(
    (error: unknown): string => {
      const maybe = error as Partial<ApiErrorLike> | null | undefined;

      const errorCode =
        maybe && typeof maybe.errorCode === 'string' ? maybe.errorCode : undefined;
      const message =
        maybe && typeof maybe.message === 'string' ? maybe.message : undefined;

      if (errorCode) {
        const key = `errors.${errorCode}`;
        const translated = t(key);
        if (translated !== key) {
          return translated;
        }
      }

      if (message) {
        return message;
      }

      return t('errors.generic');
    },
    [t],
  );
}
