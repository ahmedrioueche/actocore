import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  plansAdminApi,
  type CreateStudioPlanDto,
  type UpdateStudioPlanDto,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';

function invalidatePlans(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['platform', 'plans'] });
}

export function useCreatePlatformPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateStudioPlanDto) => {
      ensureApiConfigured();
      return parseApiResponse(await plansAdminApi.create(body));
    },
    onSuccess: () => invalidatePlans(queryClient),
  });
}

export function useUpdatePlatformPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdateStudioPlanDto;
    }) => {
      ensureApiConfigured();
      return parseApiResponse(await plansAdminApi.update(id, body));
    },
    onSuccess: () => invalidatePlans(queryClient),
  });
}

export function useSyncPlatformPlanPayPal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      ensureApiConfigured();
      return parseApiResponse(await plansAdminApi.syncPayPal(id));
    },
    onSuccess: () => invalidatePlans(queryClient),
  });
}

export function useDeletePlatformPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      ensureApiConfigured();
      return parseApiResponse(await plansAdminApi.remove(id));
    },
    onSuccess: () => invalidatePlans(queryClient),
  });
}
