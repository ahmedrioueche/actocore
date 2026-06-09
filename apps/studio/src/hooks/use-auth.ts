import { useMutation, useQuery } from '@tanstack/react-query';
import {
  studioAuthApi,
  TokenManager,
  type StudioLoginDto,
  type StudioMessageData,
  type StudioSignupDto,
} from '@ahmedrioueche/actocore-shared';

import {
  signOut,
  fetchAuthSession,
  hydrateAuthSession,
} from '@/lib/auth-session';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';
import { ensureApiConfigured } from '@/lib/configure-api';
import { getCachedSession } from '@/routes/guards';

export function useAuthMe(enabled = true) {
  ensureApiConfigured();
  const cachedSession = getCachedSession();
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const res = await studioAuthApi.me();
      return parseApiResponse(res);
    },
    enabled: enabled && Boolean(TokenManager.getAccessToken()),
    initialData: cachedSession,
    retry: false,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (body: StudioLoginDto) => {
      ensureApiConfigured();
      const res = await studioAuthApi.login(body);
      const session = parseApiResponse(res);
      await hydrateAuthSession(session);
      return session;
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
      return parseApiResponse<StudioMessageData>(res);
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (token: string) => {
      ensureApiConfigured();
      const res = await studioAuthApi.verifyEmail({ token });
      const session = parseApiResponse(res);
      await hydrateAuthSession(session);
      return session;
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

export function useCompleteGoogleAuth() {
  return useMutation({
    mutationFn: async (code: string) => {
      ensureApiConfigured();
      const res = await studioAuthApi.completeGoogleAuth({ code });
      const session = parseApiResponse(res);
      await hydrateAuthSession(session);
      return session;
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      await signOut('/login');
    },
  });
}

export function useStoreOAuthTokens() {
  return useMutation({
    mutationFn: async (tokens: { accessToken: string; refreshToken: string }) => {
      TokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
      await fetchAuthSession();
    },
  });
}
