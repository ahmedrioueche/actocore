import { redirect } from '@tanstack/react-router';
import { studioAuthApi, TokenManager } from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';

export async function requireAuth(): Promise<void> {
  ensureApiConfigured();
  const token = TokenManager.getAccessToken();
  if (!token) {
    throw redirect({ to: '/login' });
  }

  let me = await studioAuthApi.me();
  if (!me.success) {
    const refreshed = await studioAuthApi.refresh();
    if (!refreshed.success) {
      TokenManager.clearTokens();
      throw redirect({ to: '/login' });
    }
    me = await studioAuthApi.me();
    if (!me.success) {
      TokenManager.clearTokens();
      throw redirect({ to: '/login' });
    }
  }
}

export function redirectIfAuthenticated(): void {
  ensureApiConfigured();
  if (TokenManager.getAccessToken()) {
    throw redirect({ to: '/projects' });
  }
}
