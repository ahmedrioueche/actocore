import {
  ErrorCode,
  platformAuthApi,
  TokenManager,
  type PlatformAuthMeData,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';

export function isAdminPublicPath(pathname: string): boolean {
  return pathname === '/admin/login';
}

export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export async function fetchPlatformSession(): Promise<PlatformAuthMeData> {
  ensureApiConfigured();
  return queryClient.fetchQuery({
    queryKey: queryKeys.platform.me(),
    queryFn: async () => parseApiResponse(await platformAuthApi.me()),
  });
}

export async function signOutPlatform(redirectTo = '/admin/login'): Promise<void> {
  TokenManager.clearTokens();
  queryClient.clear();
  if (typeof window !== 'undefined') {
    if (window.location.pathname === redirectTo) {
      return;
    }
    window.location.assign(redirectTo);
  }
}

export async function handlePlatformUnauthorized(): Promise<void> {
  const refreshToken = TokenManager.getRefreshToken();
  if (!refreshToken) {
    await signOutPlatform();
    return;
  }
  const refreshed = await platformAuthApi.refresh({ refreshToken });
  if (refreshed.success && refreshed.data?.accessToken) {
    await fetchPlatformSession();
    return;
  }
  await signOutPlatform();
}

export function isPlatformUnauthorized(errorCode?: string): boolean {
  return errorCode === ErrorCode.UNAUTHORIZED;
}
