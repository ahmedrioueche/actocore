import { redirect } from '@tanstack/react-router';
import {
  onboardingApi,
  studioAuthApi,
  TokenManager,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';

function isOnboardingPending(
  state: {
    required: boolean;
    completed: boolean;
    skipped: boolean;
  } | undefined,
): boolean {
  return Boolean(
    state?.required && !state.completed && !state.skipped,
  );
}

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

export async function requireOnboardingComplete(): Promise<void> {
  await requireAuth();
  const res = await onboardingApi.getState();
  if (res.success && isOnboardingPending(res.data)) {
    throw redirect({ to: '/onboarding' });
  }
}

export async function requireOnboardingPending(): Promise<void> {
  await requireAuth();
  const res = await onboardingApi.getState();
  if (!res.success || !isOnboardingPending(res.data)) {
    throw redirect({ to: '/projects' });
  }
}
