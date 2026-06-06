import type { ApiResponse } from '@ahmedrioueche/actocore-shared';

import {
  handleUnauthorized,
  isUnauthorizedResponse,
} from '@/lib/auth-session';

/** Use inside TanStack Query `queryFn` / `mutationFn` — types come from shared only. */
export function parseApiResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    if (isUnauthorizedResponse(response.errorCode)) {
      void handleUnauthorized();
    }
    const err = new Error(response.message ?? response.errorCode ?? 'API_ERROR');
    (err as Error & { errorCode?: string }).errorCode = response.errorCode;
    throw err;
  }
  if (response.data === undefined) {
    throw new Error('API_SUCCESS_MISSING_DATA');
  }
  return response.data;
}
