import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  appPageLinksApi,
  type AppPageLinkData,
  type CreateAppPageLinkDto,
  type UpdateAppPageLinkDto,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';

export function useAppPageLinks(projectId: string | null) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.appPageLinks.list(projectId ?? ''),
    queryFn: async () =>
      parseApiResponse(await appPageLinksApi.list(projectId!)),
    enabled: Boolean(projectId),
  });
}

function useLinkInvalidation(projectId: string | null) {
  const queryClient = useQueryClient();
  return () => {
    if (!projectId) {
      return;
    }
    void queryClient.invalidateQueries({
      queryKey: queryKeys.appPageLinks.list(projectId),
    });
  };
}

export function useCreateAppPageLink(projectId: string | null) {
  const invalidate = useLinkInvalidation(projectId);
  return useMutation({
    mutationFn: async (
      body: CreateAppPageLinkDto,
    ): Promise<AppPageLinkData> => {
      ensureApiConfigured();
      return parseApiResponse(await appPageLinksApi.create(projectId!, body));
    },
    onSuccess: invalidate,
  });
}

export function useUpdateAppPageLink(projectId: string | null) {
  const invalidate = useLinkInvalidation(projectId);
  return useMutation({
    mutationFn: async ({
      linkId,
      body,
    }: {
      linkId: string;
      body: UpdateAppPageLinkDto;
    }): Promise<AppPageLinkData> => {
      ensureApiConfigured();
      return parseApiResponse(
        await appPageLinksApi.update(projectId!, linkId, body),
      );
    },
    onSuccess: invalidate,
  });
}

export function useDeleteAppPageLink(projectId: string | null) {
  const invalidate = useLinkInvalidation(projectId);
  return useMutation({
    mutationFn: async (linkId: string): Promise<{ id: string }> => {
      ensureApiConfigured();
      return parseApiResponse(await appPageLinksApi.remove(projectId!, linkId));
    },
    onSuccess: invalidate,
  });
}
