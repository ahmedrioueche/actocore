import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi, type ListProjectsQuery } from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';

export function useProjectsList(query: ListProjectsQuery = { archived: false }) {
  ensureApiConfigured();
  const effectiveQuery: ListProjectsQuery = { limit: 100, ...query };
  return useQuery({
    queryKey: queryKeys.projects.list(effectiveQuery),
    queryFn: async () =>
      parseApiResponse(await projectsApi.list(effectiveQuery)).items,
  });
}

export function useProject(projectId: string | null) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId ?? ''),
    queryFn: async () => parseApiResponse(await projectsApi.get(projectId!)),
    enabled: Boolean(projectId),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      ensureApiConfigured();
      return parseApiResponse(
        await projectsApi.create({ name: name.trim() }),
      );
    },
    onSuccess: (project) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() });
      queryClient.setQueryData(queryKeys.projects.detail(project.id), project);
    },
  });
}
