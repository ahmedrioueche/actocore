import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  appPagesApi,
  type AppPageData,
  type AssignAppPageActionsDto,
  type CreateAppPageDto,
  type UpdateAppPageDto,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';

export function useAppPages(projectId: string | null) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.appPages.list(projectId ?? ''),
    queryFn: async () =>
      parseApiResponse(await appPagesApi.list(projectId!)),
    enabled: Boolean(projectId),
  });
}

function usePageInvalidation(projectId: string | null) {
  const queryClient = useQueryClient();
  return () => {
    if (!projectId) {
      return;
    }
    void queryClient.invalidateQueries({
      queryKey: queryKeys.appPages.list(projectId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.actions.lists(projectId),
    });
  };
}

export function useCreateAppPage(projectId: string | null) {
  const invalidate = usePageInvalidation(projectId);
  return useMutation({
    mutationFn: async (body: CreateAppPageDto): Promise<AppPageData> => {
      ensureApiConfigured();
      return parseApiResponse(await appPagesApi.create(projectId!, body));
    },
    onSuccess: invalidate,
  });
}

export function useUpdateAppPage(projectId: string | null) {
  const invalidate = usePageInvalidation(projectId);
  return useMutation({
    mutationFn: async ({
      pageId,
      body,
    }: {
      pageId: string;
      body: UpdateAppPageDto;
    }): Promise<AppPageData> => {
      ensureApiConfigured();
      return parseApiResponse(
        await appPagesApi.update(projectId!, pageId, body),
      );
    },
    onSuccess: invalidate,
  });
}

export function useDeleteAppPage(projectId: string | null) {
  const invalidate = usePageInvalidation(projectId);
  return useMutation({
    mutationFn: async (pageId: string): Promise<{ id: string }> => {
      ensureApiConfigured();
      return parseApiResponse(await appPagesApi.remove(projectId!, pageId));
    },
    onSuccess: invalidate,
  });
}

export function useAssignAppPageActions(projectId: string | null) {
  const invalidate = usePageInvalidation(projectId);
  return useMutation({
    mutationFn: async ({
      pageId,
      body,
    }: {
      pageId: string;
      body: AssignAppPageActionsDto;
    }): Promise<AppPageData> => {
      ensureApiConfigured();
      return parseApiResponse(
        await appPagesApi.assignActions(projectId!, pageId, body),
      );
    },
    onSuccess: invalidate,
  });
}
