import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  platformAuthApi,
  TokenManager,
  type PlatformChangePasswordDto,
  type PlatformLoginDto,
  type UpdatePlatformManagerDto,
  type CreatePlatformManagerDto,
  type UpdateStudioProfileDto,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { isAdminPath } from '@/lib/platform-session';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';
import { useWindowPathname } from '@/hooks/use-window-pathname';

export function usePlatformMe(enabled = true) {
  const pathname = useWindowPathname();
  const onAdminRoute = isAdminPath(pathname);
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.platform.me(),
    queryFn: async () =>
      parseApiResponse(await platformAuthApi.me(), {
        redirectOnUnauthorized: false,
      }),
    enabled:
      enabled && onAdminRoute && Boolean(TokenManager.getAccessToken()),
    retry: false,
  });
}

export function usePlatformLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: PlatformLoginDto) => {
      ensureApiConfigured();
      return parseApiResponse(await platformAuthApi.login(body));
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.platform.me(), {
        user: data.user,
        platformAccountId: data.platformAccountId,
        isPlatformMaster: data.isPlatformMaster,
        platformPermissions: data.platformPermissions,
      });
    },
  });
}

export function useUpdatePlatformProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateStudioProfileDto) => {
      ensureApiConfigured();
      return parseApiResponse(await platformAuthApi.updateProfile(body));
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.platform.me(), data);
    },
  });
}

export function usePlatformChangePassword() {
  return useMutation({
    mutationFn: async (body: PlatformChangePasswordDto) => {
      ensureApiConfigured();
      return parseApiResponse(await platformAuthApi.changePassword(body));
    },
  });
}

export function usePlatformManagers() {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.platform.managers(),
    queryFn: async () => parseApiResponse(await platformAuthApi.listManagers()),
  });
}

export function useCreatePlatformManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreatePlatformManagerDto) => {
      ensureApiConfigured();
      return parseApiResponse(await platformAuthApi.createManager(body));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.platform.managers() });
    },
  });
}

export function useUpdatePlatformManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      body,
    }: {
      userId: string;
      body: UpdatePlatformManagerDto;
    }) => {
      ensureApiConfigured();
      return parseApiResponse(await platformAuthApi.updateManager(userId, body));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.platform.managers() });
    },
  });
}

export function useDeletePlatformManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      ensureApiConfigured();
      return parseApiResponse(await platformAuthApi.deleteManager(userId));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.platform.managers() });
    },
  });
}
