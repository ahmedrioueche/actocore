import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  accountApi,
  onboardingApi,
  projectsApi,
  type StudioAuthMeData,
  type StudioOnboardingStateData,
  type StudioOnboardingStep,
  type UpdateStudioAccountDto,
  type UpdateStudioOnboardingDto,
} from '@ahmedrioueche/actocore-shared';

import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';
import { ensureApiConfigured } from '@/lib/configure-api';

export function useOnboardingState() {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.onboarding.state(),
    queryFn: async () =>
      parseApiResponse<StudioOnboardingStateData>(
        await onboardingApi.getState(),
      ),
    retry: false,
    staleTime: 60_000,
  });
}

export function useCompleteOnboardingStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (step: StudioOnboardingStep) => {
      ensureApiConfigured();
      return parseApiResponse<StudioOnboardingStateData>(
        await onboardingApi.update({ completeStep: step }),
      );
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.onboarding.state(), data);
    },
  });
}

export function useSkipOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      ensureApiConfigured();
      return parseApiResponse<StudioOnboardingStateData>(
        await onboardingApi.update({ skip: true }),
      );
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.onboarding.state(), data);
    },
  });
}

export function useFinishOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateStudioOnboardingDto = { complete: true }) => {
      ensureApiConfigured();
      return parseApiResponse<StudioOnboardingStateData>(
        await onboardingApi.update(body),
      );
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.onboarding.state(), data);
    },
  });
}

export function useUpdateWorkspaceSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateStudioAccountDto) => {
      ensureApiConfigured();
      return parseApiResponse(await accountApi.updateAccount(body));
    },
    onSuccess: (data) => {
      queryClient.setQueryData<StudioAuthMeData | undefined>(
        queryKeys.auth.me(),
        (current) => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            account: {
              ...current.account,
              name: data.name,
              billingEmail: data.billingEmail,
              timezone: data.timezone,
              defaultLocale: data.defaultLocale,
            },
          };
        },
      );
    },
  });
}

export function useCreateOnboardingProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      ensureApiConfigured();
      return parseApiResponse(await projectsApi.create({ name: name.trim() }));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.state() });
    },
  });
}

export function useRenameOnboardingProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { projectId: string; name: string }) => {
      ensureApiConfigured();
      return parseApiResponse(
        await projectsApi.update(input.projectId, { name: input.name.trim() }),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() });
    },
  });
}

export function useOnboardingProjects(enabled: boolean) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.projects.list({ archived: false }),
    queryFn: async () =>
      parseApiResponse(await projectsApi.list({ archived: false })).items,
    enabled,
  });
}
