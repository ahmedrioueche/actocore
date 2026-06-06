import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  apiKeysApi,
  type ApiKeyIssuedData,
  type ApiKeyMetadata,
  type PaginationQuery,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';

export function useProjectApiKeys(
  projectId: string | null,
  query: PaginationQuery = {},
) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.apiKeys.list(projectId ?? '', query),
    queryFn: async () =>
      parseApiResponse(await apiKeysApi.listForProject(projectId!, query)),
    enabled: Boolean(projectId),
    placeholderData: keepPreviousData,
  });
}

export function useCreateApiKey(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name?: string): Promise<ApiKeyIssuedData> => {
      ensureApiConfigured();
      return parseApiResponse(
        await apiKeysApi.issue({
          projectId: projectId!,
          name: name?.trim() || undefined,
        }),
      );
    },
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.apiKeys.lists(projectId),
        });
      }
    },
  });
}

export function useUpdateApiKey(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      keyId,
      name,
    }: {
      keyId: string;
      name: string;
    }): Promise<ApiKeyMetadata> => {
      ensureApiConfigured();
      return parseApiResponse(
        await apiKeysApi.update(keyId, { name: name.trim() }),
      );
    },
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.apiKeys.lists(projectId),
        });
      }
    },
  });
}

export function useRevokeApiKey(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (keyId: string): Promise<ApiKeyMetadata> => {
      ensureApiConfigured();
      return parseApiResponse(await apiKeysApi.revoke(keyId));
    },
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.apiKeys.lists(projectId),
        });
      }
    },
  });
}
