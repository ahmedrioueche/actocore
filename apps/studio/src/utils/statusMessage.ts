import { ErrorCode, type ErrorCode as ErrorCodeType } from '@ahmedrioueche/actocore-shared';
import type { TFunction } from 'i18next';

const ERROR_I18N_KEYS: Partial<Record<ErrorCodeType, string>> = {
  [ErrorCode.INVALID_CREDENTIALS]: 'errors.invalidCredentials',
  [ErrorCode.EMAIL_NOT_VERIFIED]: 'errors.emailNotVerified',
  [ErrorCode.EMAIL_ALREADY_VERIFIED]: 'errors.emailAlreadyVerified',
  [ErrorCode.INVALID_VERIFICATION_TOKEN]: 'errors.invalidVerificationToken',
  [ErrorCode.INVALID_RESET_TOKEN]: 'errors.invalidResetToken',
  [ErrorCode.INVALID_REFRESH_TOKEN]: 'errors.invalidRefreshToken',
  [ErrorCode.GOOGLE_AUTH_FAILED]: 'errors.googleAuthFailed',
  [ErrorCode.GOOGLE_NOT_CONFIGURED]: 'errors.googleNotConfigured',
  [ErrorCode.USER_ALREADY_EXISTS]: 'errors.userAlreadyExists',
  [ErrorCode.VALIDATION_ERROR]: 'errors.validation',
  [ErrorCode.UNAUTHORIZED]: 'errors.unauthorized',
  [ErrorCode.FORBIDDEN]: 'errors.forbidden',
  [ErrorCode.INTERNAL_ERROR]: 'errors.internal',
  [ErrorCode.TOO_MANY_REQUESTS]: 'errors.tooManyRequests',
};

export function getMessage(
  t: TFunction,
  errorCode?: string,
  fallbackMessage?: string,
): string {
  if (errorCode) {
    const key = ERROR_I18N_KEYS[errorCode as ErrorCodeType];
    if (key) return t(key);
  }
  if (fallbackMessage) return fallbackMessage;
  return t('errors.generic');
}

export function getApiErrorMessage(
  t: TFunction,
  response: { errorCode?: string; message?: string },
): string {
  return getMessage(t, response.errorCode, response.message);
}
