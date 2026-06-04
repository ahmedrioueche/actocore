import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  studioAuthApi,
  TokenManager,
  type StudioLoginDto,
  type StudioSignupDto,
} from '@ahmedrioueche/actocore-shared';

import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';
import { ensureApiConfigured } from '@/lib/configure-api';

export function useAuthMe(enabled = true) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const res = await studioAuthApi.me();
      return parseApiResponse(res);
    },
    enabled: enabled && Boolean(TokenManager.getAccessToken()),
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: StudioLoginDto) => {
      ensureApiConfigured();
      const res = await studioAuthApi.login(body);
      return parseApiResponse(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: async (body: StudioSignupDto) => {
      ensureApiConfigured();
      const res = await studioAuthApi.signup(body);
      if (!res.success) {
        const err = new Error(res.message ?? res.errorCode ?? 'SIGNUP_FAILED');
        (err as Error & { errorCode?: string }).errorCode = res.errorCode;
        throw err;
      }
      return res.data!;
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: async (email: string) => {
      ensureApiConfigured();
      const res = await studioAuthApi.resendVerification({ email });
      return parseApiResponse(res);
    },
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      ensureApiConfigured();
      const res = await studioAuthApi.verifyEmail({ token });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      ensureApiConfigured();
      const res = await studioAuthApi.forgotPassword({ email });
      return parseApiResponse(res);
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (payload: { token: string; password: string }) => {
      ensureApiConfigured();
      const res = await studioAuthApi.resetPassword(payload);
      return parseApiResponse(res);
    },
  });
}

export function useGoogleAuth() {
  return useMutation({
    mutationFn: async () => {
      ensureApiConfigured();
      await studioAuthApi.redirectToGoogleAuth();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      ensureApiConfigured();
      if (TokenManager.getAccessToken()) {
        await studioAuthApi.logout();
      } else {
        TokenManager.clearTokens();
      }
    },
    onSettled: () => {
      queryClient.clear();
    },
  });
}

export function useStoreOAuthTokens() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tokens: { accessToken: string; refreshToken: string }) => {
      TokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
  });
}
