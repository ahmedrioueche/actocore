import type {
  ApiErrorDetails,
  ApiResponse,
} from '../types/api-response';
import type { ErrorCode } from '../types/error';

export function apiSuccess<T>(data: T, message?: string): ApiResponse<T> {
  return message ? { success: true, data, message } : { success: true, data };
}

export function apiError(
  errorCode: ErrorCode,
  message?: string,
  details?: ApiErrorDetails,
): ApiResponse<never> {
  const body: ApiResponse<never> = { success: false, errorCode };
  if (message) {
    body.message = message;
  }
  if (details) {
    body.details = details;
  }
  return body;
}
