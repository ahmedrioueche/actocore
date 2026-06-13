import type { StudioAuthMeData } from "@ahmedrioueche/actocore-shared";
import {
  onboardingApi,
  studioAuthApi,
  TokenManager,
} from "@ahmedrioueche/actocore-shared";
import { redirect } from "@tanstack/react-router";

import { canAccessProject } from "@/constants/navigation";
import { ensureApiConfigured } from "@/lib/configure-api";
import { parseApiResponse } from "@/lib/parse-api-response";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import {
  isPlatformOperatorSession,
  PLATFORM_CONSOLE_HOME,
  TENANT_ONBOARDING_HOME,
  TENANT_WORKSPACE_HOME,
} from "@/lib/tenant-workspace";

export type OnboardingState = {
  required: boolean;
  completed: boolean;
  skipped: boolean;
};

const ONBOARDING_STATE_STALE_MS = 60_000;

function isOnboardingPending(state: OnboardingState | undefined): boolean {
  return Boolean(state?.required && !state.completed && !state.skipped);
}

export function getCachedOnboardingState(): OnboardingState | undefined {
  return queryClient.getQueryData<OnboardingState>(
    queryKeys.onboarding.state(),
  );
}

export function getCachedSession(): StudioAuthMeData | undefined {
  return queryClient.getQueryData<StudioAuthMeData>(queryKeys.auth.me());
}

/** Sync guard — no network. Auth is hydrated before the router mounts. */
export function requireStudioSession(): void {
  ensureApiConfigured();
  if (!TokenManager.getAccessToken()) {
    throw redirect({ to: "/login" });
  }
}

export async function redirectIfAuthenticated(): Promise<void> {
  ensureApiConfigured();
  if (!TokenManager.getAccessToken()) {
    return;
  }
  await ensureOnboardingState();
  throw redirect({ to: resolveAuthenticatedHomePath() });
}

/** Super admins belong on `/admin`, not the tenant workspace shell. */
export function redirectPlatformOperatorFromTenantWorkspace(): void {
  const session = getCachedSession();
  if (!isPlatformOperatorSession(session)) {
    return;
  }
  throw redirect({ to: PLATFORM_CONSOLE_HOME });
}

export function resolveAuthenticatedHomePath(): string {
  const session = getCachedSession();
  if (isPlatformOperatorSession(session)) {
    return PLATFORM_CONSOLE_HOME;
  }
  if (isOnboardingPending(getCachedOnboardingState())) {
    return TENANT_ONBOARDING_HOME;
  }
  return TENANT_WORKSPACE_HOME;
}

/** Sync project access check using cached session — never blocks navigation on API calls. */
export function requireProjectAccessSync(projectId: string): void {
  requireStudioSession();

  if (!projectId) {
    throw redirect({ to: "/projects" });
  }

  const session = getCachedSession();
  if (session && !canAccessProject(session, projectId)) {
    throw redirect({ to: "/projects" });
  }
}

export function requireOnboardingPendingSync(): void {
  requireStudioSession();
  redirectPlatformOperatorFromTenantWorkspace();

  const state = getCachedOnboardingState();
  if (state && !isOnboardingPending(state)) {
    throw redirect({ to: TENANT_WORKSPACE_HOME });
  }
}

export function requireOnboardingCompleteSync(): void {
  const state = getCachedOnboardingState();
  if (isOnboardingPending(state)) {
    throw redirect({ to: TENANT_ONBOARDING_HOME });
  }
}

export function isOnboardingPendingState(
  state: OnboardingState | undefined,
): boolean {
  return isOnboardingPending(state);
}

export async function ensureOnboardingState(): Promise<OnboardingState> {
  ensureApiConfigured();
  if (!TokenManager.getAccessToken()) {
    throw new Error("Not authenticated");
  }

  return queryClient.fetchQuery({
    queryKey: queryKeys.onboarding.state(),
    queryFn: async () => parseApiResponse(await onboardingApi.getState()),
    staleTime: ONBOARDING_STATE_STALE_MS,
  });
}

/** Boot-time auth — used only before the router mounts. */
export async function requireAuth(): Promise<void> {
  ensureApiConfigured();
  const token = TokenManager.getAccessToken();
  if (!token) {
    throw redirect({ to: "/login" });
  }

  let me = await studioAuthApi.me();
  if (!me.success) {
    const refreshed = await studioAuthApi.refresh();
    if (!refreshed.success) {
      TokenManager.clearTokens();
      throw redirect({ to: "/login" });
    }
    me = await studioAuthApi.me();
    if (!me.success) {
      TokenManager.clearTokens();
      throw redirect({ to: "/login" });
    }
  }
}

export async function prefetchOnboardingState(): Promise<void> {
  if (!TokenManager.getAccessToken()) {
    return;
  }

  try {
    await ensureOnboardingState();
  } catch {
    // Best-effort warm-up; route guards fetch authoritatively.
  }
}

export async function requireOnboardingComplete(): Promise<void> {
  await ensureOnboardingState();
  requireOnboardingCompleteSync();
}

export async function requireOnboardingPending(): Promise<void> {
  await requireAuth();
  await ensureOnboardingState();
  requireOnboardingPendingSync();
}

export async function requireStudioWorkspace(): Promise<void> {
  requireStudioSession();
  redirectPlatformOperatorFromTenantWorkspace();
  await requireOnboardingComplete();
}
