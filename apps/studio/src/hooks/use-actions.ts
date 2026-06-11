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
  type ListActionsQuery,
  type Paginated,
  type UpdateActionDto,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';

function mergeActionUpdate(action: ActionData, body: UpdateActionDto): ActionData {
  const { sectionId, ...rest } = body;
  return {
    ...action,
    ...rest,
    ...(sectionId !== undefined ? { sectionId: sectionId ?? undefined } : {}),
  };
}

export function useProjectActions(
  projectId: string | null,
  query: ListActionsQuery = {},
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
    onMutate: async ({ actionId, body }) => {
      if (!projectId) {
        return;
      }

      await queryClient.cancelQueries({
        queryKey: queryKeys.actions.lists(projectId),
      });

      const previousLists = queryClient.getQueriesData<Paginated<ActionData>>({
        queryKey: queryKeys.actions.lists(projectId),
      });

      queryClient.setQueriesData<Paginated<ActionData>>(
        { queryKey: queryKeys.actions.lists(projectId) },
        (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            items: old.items.map((action) =>
              action.id === actionId ? mergeActionUpdate(action, body) : action,
            ),
          };
        },
      );

      const detailKey = queryKeys.actions.detail(projectId, actionId);
      const previousDetail = queryClient.getQueryData<ActionData>(detailKey);
      if (previousDetail) {
        queryClient.setQueryData<ActionData>(
          detailKey,
          mergeActionUpdate(previousDetail, body),
        );
      }

      return { previousLists, previousDetail, actionId };
    },
    onError: (_error, _variables, context) => {
      if (!projectId || !context) {
        return;
      }
      for (const [key, data] of context.previousLists) {
        queryClient.setQueryData(key, data);
      }
      queryClient.setQueryData(
        queryKeys.actions.detail(projectId, context.actionId),
        context.previousDetail,
      );
    },
    onSettled: (_data, _error, variables) => {
      if (!projectId) {
        return;
      }
      void queryClient.invalidateQueries({
        queryKey: queryKeys.actions.lists(projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.actions.detail(projectId, variables.actionId),
      });
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
