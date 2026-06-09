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

async function uploadKnowledgeFile(
  projectId: string,
  file: File,
  title?: string,
): Promise<KnowledgeSourceData> {
  ensureApiConfigured();
  return parseApiResponse(
    await knowledgeApi.upload(projectId, file, {
      title: title?.trim() || undefined,
      filename: file.name,
    }),
  );
}

export function useUploadKnowledge(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      title,
    }: UploadKnowledgeInput): Promise<KnowledgeSourceData> => {
      return uploadKnowledgeFile(projectId!, file, title);
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

export interface KnowledgeUploadFailure {
  file: File;
  message: string;
}

export interface KnowledgeBatchUploadResult {
  uploaded: KnowledgeSourceData[];
  failures: KnowledgeUploadFailure[];
}

export interface UploadKnowledgeBatchInput {
  files: File[];
  /** Applied only when uploading a single file. */
  title?: string;
  onProgress?: (current: number, total: number) => void;
}

export function useUploadKnowledgeBatch(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      files,
      title,
      onProgress,
    }: UploadKnowledgeBatchInput): Promise<KnowledgeBatchUploadResult> => {
      const uploaded: KnowledgeSourceData[] = [];
      const failures: KnowledgeUploadFailure[] = [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        onProgress?.(index + 1, files.length);
        try {
          uploaded.push(
            await uploadKnowledgeFile(
              projectId!,
              file,
              files.length === 1 ? title : undefined,
            ),
          );
        } catch (err) {
          failures.push({
            file,
            message: err instanceof Error ? err.message : 'Upload failed',
          });
        }
      }

      if (uploaded.length === 0 && failures.length > 0) {
        throw new Error(failures[0].message);
      }

      return { uploaded, failures };
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
