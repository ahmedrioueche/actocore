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

export function buildOptimisticAppPageLinkId(
  sourcePageId: string,
  targetPageId: string,
): string {
  return `optimistic-${sourcePageId}-${targetPageId}`;
}

export function isOptimisticAppPageLinkId(linkId: string): boolean {
  return linkId.startsWith('optimistic-');
}

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
  const queryClient = useQueryClient();
  const queryKey = queryKeys.appPageLinks.list(projectId ?? '');

  return useMutation({
    mutationFn: async (
      body: CreateAppPageLinkDto,
    ): Promise<AppPageLinkData> => {
      ensureApiConfigured();
      return parseApiResponse(await appPageLinksApi.create(projectId!, body));
    },
    onMutate: async (body) => {
      if (!projectId) {
        return { previous: undefined };
      }

      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<AppPageLinkData[]>(queryKey);
      const optimisticId = buildOptimisticAppPageLinkId(
        body.sourcePageId,
        body.targetPageId,
      );

      queryClient.setQueryData<AppPageLinkData[]>(queryKey, (current = []) => {
        if (
          current.some(
            (link) =>
              link.sourcePageId === body.sourcePageId &&
              link.targetPageId === body.targetPageId,
          )
        ) {
          return current;
        }

        return [
          ...current,
          {
            id: optimisticId,
            projectId,
            sourcePageId: body.sourcePageId,
            targetPageId: body.targetPageId,
            label: body.label,
          },
        ];
      });

      return { previous };
    },
    onError: (_error, _body, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (data) => {
      if (!projectId) {
        return;
      }

      queryClient.setQueryData<AppPageLinkData[]>(queryKey, (current = []) =>
        current.map((link) =>
          link.sourcePageId === data.sourcePageId &&
          link.targetPageId === data.targetPageId
            ? data
            : link,
        ),
      );
    },
    onSettled: () => {
      if (!projectId) {
        return;
      }
      void queryClient.invalidateQueries({ queryKey });
    },
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
