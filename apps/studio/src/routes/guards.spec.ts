import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isRedirect } from '@tanstack/react-router';

const { getAccessToken, clearTokens, me, refresh, getOnboardingState } =
  vi.hoisted(() => ({
    getAccessToken: vi.fn(),
    clearTokens: vi.fn(),
    me: vi.fn(),
    refresh: vi.fn(),
    getOnboardingState: vi.fn(),
  }));

vi.mock('@ahmedrioueche/actocore-shared', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@ahmedrioueche/actocore-shared')>();
  return {
    ...actual,
    TokenManager: { getAccessToken, clearTokens },
    studioAuthApi: { me, refresh },
    onboardingApi: { getState: getOnboardingState },
  };
});

vi.mock('@/lib/configure-api', () => ({
  ensureApiConfigured: vi.fn(),
}));

vi.mock('@/lib/query-client', () => ({
  queryClient: {
    getQueryData: vi.fn(),
    prefetchQuery: vi.fn(),
    fetchQuery: vi.fn(),
  },
}));

import { queryClient } from '@/lib/query-client';
import { StudioRole } from '@ahmedrioueche/actocore-shared';

import {
  redirectIfAuthenticated,
  redirectPlatformOperatorFromTenantWorkspace,
  requireAuth,
  requireOnboardingComplete,
  requireOnboardingPending,
  requireOnboardingPendingSync,
  requireProjectAccessSync,
  requireStudioSession,
  resolveAuthenticatedHomePath,
} from '@/routes/guards';

describe('auth route guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('redirectIfAuthenticated', () => {
    it('redirects tenant users to projects when access token exists', async () => {
      getAccessToken.mockReturnValue('token');
      vi.mocked(queryClient.fetchQuery).mockResolvedValue({
        required: true,
        completed: true,
        skipped: false,
      });
      vi.mocked(queryClient.getQueryData).mockImplementation((key) => {
        if (Array.isArray(key) && key[0] === 'onboarding') {
          return { required: true, completed: true, skipped: false };
        }
        return { role: StudioRole.USER_ADMIN };
      });
      await expect(redirectIfAuthenticated()).rejects.toSatisfy(isRedirect);
      expect(resolveAuthenticatedHomePath()).toBe('/projects');
    });

    it('redirects tenant users with pending onboarding to onboarding', async () => {
      getAccessToken.mockReturnValue('token');
      vi.mocked(queryClient.fetchQuery).mockResolvedValue({
        required: true,
        completed: false,
        skipped: false,
      });
      vi.mocked(queryClient.getQueryData).mockImplementation((key) => {
        if (Array.isArray(key) && key[0] === 'onboarding') {
          return { required: true, completed: false, skipped: false };
        }
        return { role: StudioRole.USER_ADMIN };
      });
      await expect(redirectIfAuthenticated()).rejects.toSatisfy(isRedirect);
      expect(resolveAuthenticatedHomePath()).toBe('/onboarding');
    });

    it('redirects super admin to the platform console', async () => {
      getAccessToken.mockReturnValue('token');
      vi.mocked(queryClient.fetchQuery).mockResolvedValue({
        required: false,
        completed: false,
        skipped: false,
      });
      vi.mocked(queryClient.getQueryData).mockReturnValue({
        role: StudioRole.SUPER_ADMIN,
      });
      await expect(redirectIfAuthenticated()).rejects.toSatisfy(isRedirect);
      expect(resolveAuthenticatedHomePath()).toBe('/admin');
    });

    it('does nothing when no token', async () => {
      getAccessToken.mockReturnValue(null);
      await expect(redirectIfAuthenticated()).resolves.toBeUndefined();
    });
  });

  describe('redirectPlatformOperatorFromTenantWorkspace', () => {
    it('redirects super admin away from tenant workspace routes', () => {
      vi.mocked(queryClient.getQueryData).mockReturnValue({
        role: StudioRole.SUPER_ADMIN,
      });
      expect(() => redirectPlatformOperatorFromTenantWorkspace()).toThrow();
    });

    it('allows tenant admins through', () => {
      vi.mocked(queryClient.getQueryData).mockReturnValue({
        role: StudioRole.USER_ADMIN,
      });
      expect(() => redirectPlatformOperatorFromTenantWorkspace()).not.toThrow();
    });
  });

  describe('resolveAuthenticatedHomePath', () => {
    it('returns platform console for super admin', () => {
      vi.mocked(queryClient.getQueryData).mockReturnValue({
        role: StudioRole.SUPER_ADMIN,
      });
      expect(resolveAuthenticatedHomePath()).toBe('/admin');
    });

    it('returns projects for tenant users', () => {
      vi.mocked(queryClient.getQueryData).mockReturnValue({
        role: StudioRole.USER_EDITOR,
      });
      expect(resolveAuthenticatedHomePath()).toBe('/projects');
    });
  });

  describe('requireStudioSession', () => {
    it('redirects to login when no token', () => {
      getAccessToken.mockReturnValue(null);
      expect(() => requireStudioSession()).toThrow();
    });
  });

  describe('requireAuth', () => {
    it('redirects to login when no token', async () => {
      getAccessToken.mockReturnValue(null);
      await expect(requireAuth()).rejects.toSatisfy(isRedirect);
    });

    it('resolves when me succeeds', async () => {
      getAccessToken.mockReturnValue('token');
      me.mockResolvedValue({ success: true, data: {} });
      await expect(requireAuth()).resolves.toBeUndefined();
      expect(refresh).not.toHaveBeenCalled();
    });

    it('refreshes and retries me when first me fails', async () => {
      getAccessToken.mockReturnValue('token');
      me
        .mockResolvedValueOnce({ success: false })
        .mockResolvedValueOnce({ success: true, data: {} });
      refresh.mockResolvedValue({ success: true, data: { accessToken: 'new' } });

      await expect(requireAuth()).resolves.toBeUndefined();
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(me).toHaveBeenCalledTimes(2);
    });

    it('clears tokens and redirects when refresh fails', async () => {
      getAccessToken.mockReturnValue('token');
      me.mockResolvedValue({ success: false });
      refresh.mockResolvedValue({ success: false });

      await expect(requireAuth()).rejects.toSatisfy(isRedirect);
      expect(clearTokens).toHaveBeenCalled();
    });
  });

  describe('onboarding guards', () => {
    beforeEach(() => {
      getAccessToken.mockReturnValue('token');
      me.mockResolvedValue({ success: true, data: {} });
    });

    it('requireOnboardingPendingSync redirects to projects when done', () => {
      vi.mocked(queryClient.getQueryData).mockReturnValue({
        required: true,
        completed: true,
        skipped: false,
      });
      expect(() => requireOnboardingPendingSync()).toThrow();
    });

    it('requireOnboardingPending redirects to projects when done', async () => {
      getOnboardingState.mockResolvedValue({
        success: true,
        data: { required: true, completed: true, skipped: false },
      });
      vi.mocked(queryClient.fetchQuery).mockResolvedValue({
        required: true,
        completed: true,
        skipped: false,
      });
      vi.mocked(queryClient.getQueryData).mockReturnValue({
        required: true,
        completed: true,
        skipped: false,
      });
      await expect(requireOnboardingPending()).rejects.toSatisfy(isRedirect);
    });

    it('requireOnboardingComplete redirects to onboarding when pending', async () => {
      vi.mocked(queryClient.fetchQuery).mockResolvedValue({
        required: true,
        completed: false,
        skipped: false,
      });
      vi.mocked(queryClient.getQueryData).mockReturnValue({
        required: true,
        completed: false,
        skipped: false,
      });
      await expect(requireOnboardingComplete()).rejects.toSatisfy(isRedirect);
    });

    it('requireOnboardingComplete allows through when done', async () => {
      vi.mocked(queryClient.fetchQuery).mockResolvedValue({
        required: true,
        completed: true,
        skipped: false,
      });
      vi.mocked(queryClient.getQueryData).mockReturnValue({
        required: true,
        completed: true,
        skipped: false,
      });
      await expect(requireOnboardingComplete()).resolves.toBeUndefined();
    });
  });

  describe('requireProjectAccessSync', () => {
    it('redirects to projects when editor lacks access', () => {
      getAccessToken.mockReturnValue('token');
      vi.mocked(queryClient.getQueryData).mockReturnValue({
        role: 'user_editor',
        projectIds: ['other-project'],
      });
      expect(() => requireProjectAccessSync('project-1')).toThrow();
    });
  });
});
