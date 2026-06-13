import {
  ErrorCode,
  type ApiErrorDetails,
  type ErrorCode as ErrorCodeType,
  type PlanLimitErrorDetails,
  type StudioTestAccountLeaseBusyDetails,
} from '@ahmedrioueche/actocore-shared';
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
  [ErrorCode.PROJECT_LIMIT_REACHED]: 'errors.projectLimitReached',
  [ErrorCode.SEAT_LIMIT_REACHED]: 'errors.seatLimitReached',
  [ErrorCode.ACTION_LIMIT_REACHED]: 'errors.actionLimitReached',
  [ErrorCode.QUOTA_EXCEEDED]: 'errors.chatQuotaExceeded',
  [ErrorCode.TEAM_MEMBER_NOT_FOUND]: 'errors.teamMemberNotFound',
  [ErrorCode.CANNOT_REMOVE_SELF]: 'errors.cannotRemoveSelf',
  [ErrorCode.CANNOT_REMOVE_ADMIN]: 'errors.cannotRemoveAdmin',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'errors.insufficientPermissions',
  [ErrorCode.INVALID_OTP]: 'errors.invalidOtp',
  [ErrorCode.DELETE_ACCOUNT_BLOCKED]: 'errors.deleteAccountBlocked',
  [ErrorCode.SEAT_SELF_DELETE_BLOCKED]: 'errors.seatSelfDeleteBlocked',
  [ErrorCode.TEST_ACCOUNT_IN_USE]: 'errors.testAccountInUse',
  [ErrorCode.TEST_ACCOUNT_LEASE_EXPIRED]: 'errors.testAccountLeaseExpired',
};

function isPlanLimitDetails(
  details?: ApiErrorDetails,
): details is PlanLimitErrorDetails {
  return details != null && 'limit' in details;
}

function isTestAccountBusyDetails(
  details?: ApiErrorDetails,
): details is StudioTestAccountLeaseBusyDetails {
  return details != null && 'retryAfterSeconds' in details;
}
function resolveLimit(
  details?: ApiErrorDetails,
  fallbackMessage?: string,
): number | undefined {
  if (isPlanLimitDetails(details)) {
    if (details.limit != null) {
      return details.limit;
    }
  }
  if (!fallbackMessage) {
    return undefined;
  }
  const match = fallbackMessage.match(/\((\d+)\)/);
  return match ? Number(match[1]) : undefined;
}

const PREFER_SERVER_MESSAGE_CODES = new Set<ErrorCodeType>([
  ErrorCode.VALIDATION_ERROR,
  ErrorCode.USER_ALREADY_EXISTS,
]);

export function getMessage(
  t: TFunction,
  errorCode?: string,
  fallbackMessage?: string,
  details?: ApiErrorDetails,
): string {
  if (
    errorCode &&
    fallbackMessage?.trim() &&
    PREFER_SERVER_MESSAGE_CODES.has(errorCode as ErrorCodeType)
  ) {
    return fallbackMessage;
  }

  if (errorCode) {
    const key = ERROR_I18N_KEYS[errorCode as ErrorCodeType];
    if (key) {
      const limit = resolveLimit(details, fallbackMessage);
      if (
        limit != null &&
        (errorCode === ErrorCode.PROJECT_LIMIT_REACHED ||
          errorCode === ErrorCode.SEAT_LIMIT_REACHED ||
          errorCode === ErrorCode.ACTION_LIMIT_REACHED ||
          errorCode === ErrorCode.QUOTA_EXCEEDED)
      ) {
        return t(key, { limit });
      }
      if (
        errorCode === ErrorCode.TEST_ACCOUNT_IN_USE &&
        isTestAccountBusyDetails(details)
      ) {
        const minutes = Math.max(
          1,
          Math.ceil(details.retryAfterSeconds / 60),
        );
        return t(key, { minutes });
      }
      return t(key);
    }
  }
  if (fallbackMessage) return fallbackMessage;
  return t('errors.generic');
}

export function getApiErrorMessage(
  t: TFunction,
  response: {
    errorCode?: string;
    message?: string;
    details?: ApiErrorDetails;
  },
): string {
  return getMessage(
    t,
    response.errorCode,
    response.message,
    response.details,
  );
}

export function getUnknownApiErrorMessage(t: TFunction, err: unknown): string {
  if (err instanceof Error) {
    const apiErr = err as Error & {
      errorCode?: string;
      details?: ApiErrorDetails;
    };
    return getApiErrorMessage(t, {
      errorCode: apiErr.errorCode,
      message: apiErr.message,
      details: apiErr.details,
    });
  }
  if (err && typeof err === 'object') {
    const payload = err as {
      errorCode?: string;
      message?: string;
      details?: ApiErrorDetails;
    };
    return getApiErrorMessage(t, payload);
  }
  return t('errors.generic');
}
