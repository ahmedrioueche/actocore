import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { login, signup, setTokens } = vi.hoisted(() => ({
  login: vi.fn(),
  signup: vi.fn(),
  setTokens: vi.fn(),
}));

vi.mock('@ahmedrioueche/actocore-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ahmedrioueche/actocore-shared')>();
  return {
    ...actual,
    studioAuthApi: { login, signup },
    TokenManager: { setTokens },
  };
});

vi.mock('@/lib/configure-api', () => ({
  ensureApiConfigured: vi.fn(),
}));

import { useLogin, useSignup } from '@/hooks/use-auth';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('use-auth hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useLogin', () => {
    it('calls studioAuthApi.login with email credentials', async () => {
      login.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'a',
          refreshToken: 'r',
          user: {},
          account: {},
          role: 'user_admin',
          permissions: [],
          projectIds: [],
        },
      });

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        email: 'admin@example.com',
        password: 'secret123',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(login).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'secret123',
      });
    });

    it('surfaces API errors', async () => {
      login.mockResolvedValue({
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Nope',
      });

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ email: 'x@y.com', password: 'bad' });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect((result.current.error as Error).message).toBe('Nope');
    });
  });

  describe('useSignup', () => {
    it('returns signup result data on success', async () => {
      signup.mockResolvedValue({
        success: true,
        data: { message: 'ok', email: 'new@example.com' },
      });

      const { result } = renderHook(() => useSignup(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        accountName: 'Acme',
        email: 'new@example.com',
        password: 'password12',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.email).toBe('new@example.com');
    });
  });
});
