import { studioAuthApi, TokenManager } from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';

/** Studio logout — clears tokens and optional server session. */
export async function handleLogout(redirectTo = '/login'): Promise<void> {
  ensureApiConfigured();
  try {
    if (TokenManager.getAccessToken()) {
      await studioAuthApi.logout();
    }
  } finally {
    TokenManager.clearTokens();
    window.location.assign(redirectTo);
  }
}
