import type {
  ApiResponse,
  ApiErrorDetails,
} from '@ahmedrioueche/actocore-shared';

import {
  handleUnauthorized,
  isLogoutInProgress,
  isUnauthorizedResponse,
} from '@/lib/auth-session';

/** Use inside TanStack Query `queryFn` / `mutationFn` — types come from shared only. */
export function parseApiResponse<T>(
  response: ApiResponse<T>,
  options?: { redirectOnUnauthorized?: boolean },
): T {
  if (!response.success) {
    if (
      options?.redirectOnUnauthorized !== false &&
      isUnauthorizedResponse(response.errorCode) &&
      !isLogoutInProgress()
    ) {
      void handleUnauthorized();
    }
    const err = new Error(response.message ?? response.errorCode ?? 'API_ERROR');
    const apiErr = err as Error & {
      errorCode?: string;
      details?: ApiErrorDetails;
    };
    apiErr.errorCode = response.errorCode;
    if (response.details) {
      apiErr.details = response.details;
    }
    throw err;
  }
  if (response.data === undefined) {
    throw new Error('API_SUCCESS_MISSING_DATA');
  }
  return response.data;
}
