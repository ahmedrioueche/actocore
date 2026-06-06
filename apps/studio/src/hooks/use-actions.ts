import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  actionsApi,
  type ActionData,
  type CreateActionDto,
  type PaginationQuery,
  type UpdateActionDto,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';

export function useProjectActions(
  projectId: string | null,
  query: PaginationQuery = {},
) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.actions.list(projectId ?? '', query),
    queryFn: async () =>
      parseApiResponse(await actionsApi.list(projectId!, query)),
    enabled: Boolean(projectId),
    placeholderData: keepPreviousData,
  });
}

export function useAction(projectId: string | null, actionId: string | null) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.actions.detail(projectId ?? '', actionId ?? ''),
    queryFn: async () =>
      parseApiResponse(await actionsApi.get(projectId!, actionId!)),
    enabled: Boolean(projectId && actionId),
  });
}

export function useCreateAction(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateActionDto): Promise<ActionData> => {
      ensureApiConfigured();
      return parseApiResponse(await actionsApi.create(projectId!, body));
    },
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.actions.lists(projectId),
        });
      }
    },
  });
}

export function useUpdateAction(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      actionId,
      body,
    }: {
      actionId: string;
      body: UpdateActionDto;
    }): Promise<ActionData> => {
      ensureApiConfigured();
      return parseApiResponse(
        await actionsApi.update(projectId!, actionId, body),
      );
    },
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.actions.lists(projectId),
        });
      }
    },
  });
}

export function useDeleteAction(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (actionId: string): Promise<{ id: string }> => {
      ensureApiConfigured();
      return parseApiResponse(await actionsApi.remove(projectId!, actionId));
    },
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.actions.lists(projectId),
        });
      }
    },
  });
}
