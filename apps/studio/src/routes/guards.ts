import { redirect } from '@tanstack/react-router';
import type { StudioAuthMeData } from '@ahmedrioueche/actocore-shared';
import {
  onboardingApi,
  studioAuthApi,
  TokenManager,
} from '@ahmedrioueche/actocore-shared';

import { canAccessProject } from '@/constants/navigation';
import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';

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

export function getCachedSession(): StudioAuthMeData | undefined {
  return queryClient.getQueryData<StudioAuthMeData>(queryKeys.auth.me());
}

/** Sync guard — no network. Auth is hydrated before the router mounts. */
export function requireStudioSession(): void {
  ensureApiConfigured();
  if (!TokenManager.getAccessToken()) {
    throw redirect({ to: '/login' });
  }
}

export function redirectIfAuthenticated(): void {
  ensureApiConfigured();
  if (TokenManager.getAccessToken()) {
    throw redirect({ to: '/projects' });
  }
}

/** Sync project access check using cached session — never blocks navigation on API calls. */
export function requireProjectAccessSync(projectId: string): void {
  requireStudioSession();

  if (!projectId) {
    throw redirect({ to: '/projects' });
  }

  const session = getCachedSession();
  if (session && !canAccessProject(session, projectId)) {
    throw redirect({ to: '/projects' });
  }
}

export function requireOnboardingPendingSync(): void {
  requireStudioSession();

  const state = queryClient.getQueryData<{
    required: boolean;
    completed: boolean;
    skipped: boolean;
  }>(queryKeys.onboarding.state());

  if (state && !isOnboardingPending(state)) {
    throw redirect({ to: '/projects' });
  }
}

export function isOnboardingPendingState(
  state: {
    required: boolean;
    completed: boolean;
    skipped: boolean;
  } | undefined,
): boolean {
  return isOnboardingPending(state);
}

/** Boot-time auth — used only before the router mounts. */
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

export async function prefetchOnboardingState(): Promise<void> {
  ensureApiConfigured();
  if (!TokenManager.getAccessToken()) {
    return;
  }

  await queryClient.prefetchQuery({
    queryKey: queryKeys.onboarding.state(),
    queryFn: async () =>
      parseApiResponse(await onboardingApi.getState()),
    staleTime: 60_000,
  });
}

export async function requireOnboardingPending(): Promise<void> {
  await requireAuth();
  await prefetchOnboardingState();
  requireOnboardingPendingSync();
}
