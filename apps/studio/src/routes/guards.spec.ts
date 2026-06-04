import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isRedirect } from '@tanstack/react-router';

const { getAccessToken, clearTokens, me, refresh } = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
  clearTokens: vi.fn(),
  me: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@ahmedrioueche/actocore-shared', () => ({
  TokenManager: { getAccessToken, clearTokens },
  studioAuthApi: { me, refresh },
}));

vi.mock('@/lib/configure-api', () => ({
  ensureApiConfigured: vi.fn(),
}));

import { redirectIfAuthenticated, requireAuth } from '@/routes/guards';

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
});
