import { useQuery } from '@tanstack/react-query';
import { studioUsageApi } from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';

export function useWorkspaceUsageSummary(from?: string, to?: string) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.usage.workspace({ from, to }),
    queryFn: async () =>
      parseApiResponse(
        await studioUsageApi.getAccountSummary(
          from || to ? { from, to } : undefined,
        ),
      ),
    enabled: Boolean(from && to),
  });
}

export function useProjectUsageSummary(
  projectId: string | null | undefined,
  from?: string,
  to?: string,
) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.usage.projectSummary(projectId ?? '', { from, to }),
    queryFn: async () =>
      parseApiResponse(
        await studioUsageApi.getProjectSummary(projectId!, { from, to }),
      ),
    enabled: Boolean(projectId && from && to),
  });
}

export function useProjectUsageSeries(
  projectId: string | null | undefined,
  from?: string,
  to?: string,
) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.usage.projectSeries(projectId ?? '', { from, to }),
    queryFn: async () =>
      parseApiResponse(
        await studioUsageApi.getProjectSeries(projectId!, { from, to }),
      ),
    enabled: Boolean(projectId && from && to),
  });
}

export function useProjectUsageBreakdown(
  projectId: string | null | undefined,
  from?: string,
  to?: string,
) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.usage.projectBreakdown(projectId ?? '', { from, to }),
    queryFn: async () =>
      parseApiResponse(
        await studioUsageApi.getProjectBreakdown(projectId!, { from, to }),
      ),
    enabled: Boolean(projectId && from && to),
  });
}
