import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  actionSectionsApi,
  type ActionSectionData,
  type CreateActionSectionDto,
  type UpdateActionSectionDto,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';

export function useActionSections(projectId: string | null) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.actionSections.list(projectId ?? ''),
    queryFn: async () =>
      parseApiResponse(await actionSectionsApi.list(projectId!)),
    enabled: Boolean(projectId),
  });
}

function useSectionInvalidation(projectId: string | null) {
  const queryClient = useQueryClient();
  return () => {
    if (!projectId) {
      return;
    }
    void queryClient.invalidateQueries({
      queryKey: queryKeys.actionSections.list(projectId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.actions.lists(projectId),
    });
  };
}

export function useCreateActionSection(projectId: string | null) {
  const invalidate = useSectionInvalidation(projectId);
  return useMutation({
    mutationFn: async (
      body: CreateActionSectionDto,
    ): Promise<ActionSectionData> => {
      ensureApiConfigured();
      return parseApiResponse(await actionSectionsApi.create(projectId!, body));
    },
    onSuccess: invalidate,
  });
}

export function useUpdateActionSection(projectId: string | null) {
  const invalidate = useSectionInvalidation(projectId);
  return useMutation({
    mutationFn: async ({
      sectionId,
      body,
    }: {
      sectionId: string;
      body: UpdateActionSectionDto;
    }): Promise<ActionSectionData> => {
      ensureApiConfigured();
      return parseApiResponse(
        await actionSectionsApi.update(projectId!, sectionId, body),
      );
    },
    onSuccess: invalidate,
  });
}

export function useDeleteActionSection(projectId: string | null) {
  const invalidate = useSectionInvalidation(projectId);
  return useMutation({
    mutationFn: async (sectionId: string): Promise<{ id: string }> => {
      ensureApiConfigured();
      return parseApiResponse(
        await actionSectionsApi.remove(projectId!, sectionId),
      );
    },
    onSuccess: invalidate,
  });
}

export function useReorderActionSections(projectId: string | null) {
  const invalidate = useSectionInvalidation(projectId);
  return useMutation({
    mutationFn: async (sectionIds: string[]): Promise<ActionSectionData[]> => {
      ensureApiConfigured();
      return parseApiResponse(
        await actionSectionsApi.reorder(projectId!, { sectionIds }),
      );
    },
    onSuccess: invalidate,
  });
}
