import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  knowledgeApi,
  type KnowledgeSourceData,
  type PaginationQuery,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';

export function useProjectKnowledge(
  projectId: string | null,
  query: PaginationQuery = {},
) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.knowledge.list(projectId ?? '', query),
    queryFn: async () =>
      parseApiResponse(await knowledgeApi.list(projectId!, query)),
    enabled: Boolean(projectId),
    placeholderData: keepPreviousData,
  });
}

export interface UploadKnowledgeInput {
  file: File;
  title?: string;
}

export function useUploadKnowledge(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      title,
    }: UploadKnowledgeInput): Promise<KnowledgeSourceData> => {
      ensureApiConfigured();
      return parseApiResponse(
        await knowledgeApi.upload(projectId!, file, {
          title: title?.trim() || undefined,
          filename: file.name,
        }),
      );
    },
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.knowledge.lists(projectId),
        });
      }
    },
  });
}

export function useDeleteKnowledge(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sourceId: string): Promise<{ id: string }> => {
      ensureApiConfigured();
      return parseApiResponse(await knowledgeApi.remove(projectId!, sourceId));
    },
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.knowledge.lists(projectId),
        });
      }
    },
  });
}
