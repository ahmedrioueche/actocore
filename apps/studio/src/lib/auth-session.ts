import {
  ErrorCode,
  studioAuthApi,
  TokenManager,
  type StudioAuthMeData,
  type StudioSessionData,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import { clearTestAccountLease } from '@/lib/test-account-lease';

let logoutInProgress = false;
let refreshInFlight: Promise<boolean> | null = null;

export function isLogoutInProgress(): boolean {
  return logoutInProgress;
}

export async function clearAuthSession(): Promise<void> {
  TokenManager.clearTokens();
  clearTestAccountLease();
  queryClient.clear();
}

export function resolveLoginRedirect(pathname = window.location.pathname): string {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return '/admin/login';
  }
  return '/login';
}

/** Hard reset — clears cache/tokens and reloads on the login page. */
export async function forceLogout(redirectTo?: string): Promise<void> {
  if (logoutInProgress) {
    return;
  }
  logoutInProgress = true;
  try {
    await clearAuthSession();
  } finally {
    if (typeof window !== 'undefined') {
      const target = redirectTo ?? resolveLoginRedirect();
      if (window.location.pathname === target) {
        logoutInProgress = false;
        return;
      }
      window.location.assign(target);
    }
  }
}

async function tryRefreshSession(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    ensureApiConfigured();
    if (!TokenManager.getRefreshToken()) {
      return false;
    }
    const res = await studioAuthApi.refresh();
    return Boolean(res.success && res.data?.accessToken);
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

/** Called when an API response indicates the session is invalid. */
export async function handleUnauthorized(): Promise<void> {
  if (logoutInProgress) {
    return;
  }

  const refreshed = await tryRefreshSession();
  if (refreshed) {
    await fetchAuthSession();
    return;
  }

  await forceLogout();
}

export function isUnauthorizedResponse(errorCode?: string): boolean {
  return (
    errorCode === ErrorCode.UNAUTHORIZED ||
    errorCode === ErrorCode.TEST_ACCOUNT_LEASE_EXPIRED
  );
}

/** Sign out locally always; best-effort server revoke. */
export async function signOut(redirectTo = '/login'): Promise<void> {
  if (logoutInProgress) {
    return;
  }
  logoutInProgress = true;
  ensureApiConfigured();

  try {
    if (TokenManager.getAccessToken()) {
      await studioAuthApi.logout();
    }
  } catch {
    // Session may already be invalid — local cleanup still required.
  } finally {
    await clearAuthSession();
    if (typeof window !== 'undefined') {
      window.location.assign(redirectTo);
    }
  }
}

export function isPublicAppPath(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/auth/') ||
    pathname === '/onboarding' ||
    pathname === '/admin/login'
  );
}

export function shouldRedirectToLogin(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const pathname = window.location.pathname;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return false;
  }
  return !TokenManager.getAccessToken() && !isPublicAppPath(pathname);
}

export function sessionFromLogin(data: StudioSessionData): StudioAuthMeData {
  return {
    user: data.user,
    account: data.account,
    role: data.role,
    permissions: data.permissions,
    projectIds: data.projectIds,
  };
}

/** Prime the auth cache from a login/verify response before `/me` returns. */
export function setAuthSessionCache(session: StudioAuthMeData): void {
  queryClient.setQueryData(queryKeys.auth.me(), session);
}

/** Load `/me` into the query cache — call after tokens are stored. */
export async function fetchAuthSession(): Promise<StudioAuthMeData> {
  ensureApiConfigured();
  return queryClient.fetchQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => parseApiResponse(await studioAuthApi.me()),
    staleTime: 0,
  });
}

async function refreshAuthSessionInBackground(): Promise<void> {
  try {
    await fetchAuthSession();
  } catch {
    // Keep the login-seeded session when `/me` races logout or transient 401.
  }
}

/** Seed cache from login payload; refresh `/me` in the background (non-blocking). */
export async function hydrateAuthSession(
  loginData: StudioSessionData,
): Promise<StudioAuthMeData> {
  const session = sessionFromLogin(loginData);
  queryClient.resetQueries({ queryKey: queryKeys.auth.me() });
  setAuthSessionCache(session);
  void refreshAuthSessionInBackground();
  return session;
}
