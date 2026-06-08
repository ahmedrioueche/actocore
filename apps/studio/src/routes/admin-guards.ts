import { redirect } from '@tanstack/react-router';
import {
  PlatformPermission,
  TokenManager,
  type PlatformAuthMeData,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import {
  canAccessPlatform,
  getDefaultAdminPath,
} from '@/lib/platform-permissions';
import { fetchPlatformSession } from '@/lib/platform-session';
import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';

export function getCachedPlatformSession(): PlatformAuthMeData | undefined {
  return queryClient.getQueryData<PlatformAuthMeData>(queryKeys.platform.me());
}

/** Sync guard — no network. Platform session is hydrated before the router mounts. */
export function requirePlatformSession(): void {
  ensureApiConfigured();
  if (!TokenManager.getAccessToken()) {
    throw redirect({ to: '/admin/login' });
  }
}

export function redirectIfPlatformAuthenticated(): void {
  ensureApiConfigured();
  const session = getCachedPlatformSession();
  if (TokenManager.getAccessToken() && session) {
    throw redirect({ to: getDefaultAdminPath(session) });
  }
}

export function requirePlatformAnalyticsAccess(): void {
  ensureApiConfigured();
  const session = getCachedPlatformSession();
  if (!canAccessPlatform(session, PlatformPermission.ANALYTICS_READ)) {
    throw redirect({ to: getDefaultAdminPath(session) });
  }
}

/** Cache-aware session hydration — use at boot, not in route guards. */
export async function bootstrapPlatformAuth(): Promise<void> {
  ensureApiConfigured();
  if (!TokenManager.getAccessToken()) {
    throw redirect({ to: '/admin/login' });
  }

  try {
    await fetchPlatformSession();
  } catch {
    TokenManager.clearTokens();
    throw redirect({ to: '/admin/login' });
  }
}
