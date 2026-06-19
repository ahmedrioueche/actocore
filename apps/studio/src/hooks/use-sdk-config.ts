import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';import {
  sdkConfigApi,
  type TranslateSdkCopyDto,
  type UpdateSdkProjectConfigDto,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';

export function useSdkConfig(projectId: string | null) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.sdkConfig.detail(projectId ?? ''),
    queryFn: async () =>
      parseApiResponse(await sdkConfigApi.get(projectId!)),
    enabled: Boolean(projectId),
  });
}

export function useUpdateSdkConfig(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateSdkProjectConfigDto) => {
      ensureApiConfigured();
      return parseApiResponse(await sdkConfigApi.update(projectId!, body));
    },
    onSuccess: (data) => {
      if (projectId) {
        queryClient.setQueryData(queryKeys.sdkConfig.detail(projectId), data);
      }
    },
  });
}

export function useTranslateSdkCopy(projectId: string | null) {
  return useMutation({
    mutationFn: async (body: TranslateSdkCopyDto) => {
      ensureApiConfigured();
      return parseApiResponse(await sdkConfigApi.translateCopy(projectId!, body));
    },
  });
}
