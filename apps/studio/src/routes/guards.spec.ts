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
  },
}));

import { queryClient } from '@/lib/query-client';
import {
  redirectIfAuthenticated,
  requireAuth,
  requireOnboardingPending,
  requireOnboardingPendingSync,
  requireProjectAccessSync,
  requireStudioSession,
} from '@/routes/guards';

describe('auth route guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('redirectIfAuthenticated', () => {
    it('redirects to projects when access token exists', () => {
      getAccessToken.mockReturnValue('token');
      let thrown: unknown;
      try {
        redirectIfAuthenticated();
      } catch (e) {
        thrown = e;
      }
      expect(isRedirect(thrown)).toBe(true);
    });

    it('does nothing when no token', () => {
      getAccessToken.mockReturnValue(null);
      expect(() => redirectIfAuthenticated()).not.toThrow();
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
      vi.mocked(queryClient.prefetchQuery).mockResolvedValue(undefined);
      vi.mocked(queryClient.getQueryData).mockReturnValue({
        required: true,
        completed: true,
        skipped: false,
      });
      await expect(requireOnboardingPending()).rejects.toSatisfy(isRedirect);
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
