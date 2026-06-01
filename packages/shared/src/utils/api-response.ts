import type { ApiResponse } from '../types/api-response';
import type { ErrorCode } from '../types/error';

export function apiSuccess<T>(data: T, message?: string): ApiResponse<T> {
  return message ? { success: true, data, message } : { success: true, data };
}

export function apiError(
  errorCode: ErrorCode,
  message?: string,
): ApiResponse<never> {
  return message
    ? { success: false, errorCode, message }
    : { success: false, errorCode };
}
