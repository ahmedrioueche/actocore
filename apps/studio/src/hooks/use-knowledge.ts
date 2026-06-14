import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  knowledgeApi,
  type KnowledgeSourceData,
  type KnowledgeSourceStatus,
  type PaginationQuery,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';

const ACTIVE_KNOWLEDGE_STATUSES: KnowledgeSourceStatus[] = [
  'pending',
  'indexing',
];

const KNOWLEDGE_POLL_INTERVAL_MS = 3000;

function hasActiveKnowledgeSources(
  sources: KnowledgeSourceData[] | undefined,
): boolean {
  return (
    sources?.some((source) =>
      ACTIVE_KNOWLEDGE_STATUSES.includes(source.status),
    ) ?? false
  );
}

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
    refetchInterval: (queryState) =>
      hasActiveKnowledgeSources(queryState.state.data?.items)
        ? KNOWLEDGE_POLL_INTERVAL_MS
        : false,
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

export function useKnowledgeSource(
  projectId: string | null,
  sourceId: string | null,
) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.knowledge.detail(projectId ?? '', sourceId ?? ''),
    queryFn: async () =>
      parseApiResponse(await knowledgeApi.get(projectId!, sourceId!)),
    enabled: Boolean(projectId && sourceId),
    refetchInterval: (queryState) => {
      const status = queryState.state.data?.status;
      return status && ACTIVE_KNOWLEDGE_STATUSES.includes(status)
        ? KNOWLEDGE_POLL_INTERVAL_MS
        : false;
    },
  });
}

export function useKnowledgeChunks(
  projectId: string | null,
  sourceId: string | null,
  query: PaginationQuery = {},
) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.knowledge.chunks(
      projectId ?? '',
      sourceId ?? '',
      query,
    ),
    queryFn: async () =>
      parseApiResponse(
        await knowledgeApi.listChunks(projectId!, sourceId!, query),
      ),
    enabled: Boolean(projectId && sourceId),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateKnowledge(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sourceId,
      pageIds,
    }: {
      sourceId: string;
      pageIds: string[];
    }) => {
      ensureApiConfigured();
      return parseApiResponse(
        await knowledgeApi.update(projectId!, sourceId, { pageIds }),
      );
    },
    onSuccess: (_data, variables) => {
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.knowledge.lists(projectId),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.knowledge.detail(projectId, variables.sourceId),
        });
      }
    },
  });
}

export function useReindexKnowledge(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sourceId: string) => {
      ensureApiConfigured();
      return parseApiResponse(
        await knowledgeApi.reindex(projectId!, sourceId),
      );
    },
    onSuccess: (_data, sourceId) => {
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.knowledge.lists(projectId),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.knowledge.detail(projectId, sourceId),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.knowledge.chunks(projectId, sourceId),
        });
      }
    },
  });
}

export function useRetrieveTestKnowledge(projectId: string | null) {
  return useMutation({
    mutationFn: async (body: {
      query: string;
      currentPageId?: string;
      topK?: number;
    }) => {
      ensureApiConfigured();
      return parseApiResponse(
        await knowledgeApi.retrieveTest(projectId!, body),
      );
    },
  });
}
