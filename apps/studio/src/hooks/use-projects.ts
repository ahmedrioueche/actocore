import { useQuery } from '@tanstack/react-query';
import { projectsApi, type ListProjectsQuery } from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';

export function useProjectsList(query: ListProjectsQuery = { archived: false }) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.projects.list(query),
    queryFn: async () => parseApiResponse(await projectsApi.list(query)),
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
