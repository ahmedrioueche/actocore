import { useMemo } from 'react';

import { resolveUsageDateRange } from '@/hooks/use-usage-date-range';
import { useProjectActions } from '@/hooks/use-actions';
import { useAppPages } from '@/hooks/use-app-pages';
import { useProjectApiKeys } from '@/hooks/use-api-keys';
import { useProjectKnowledge } from '@/hooks/use-knowledge';
import { useProject } from '@/hooks/use-projects';
import {
  useProjectUsageBreakdown,
  useProjectUsageSummary,
} from '@/hooks/use-usage-data';

const COUNT_QUERY = { page: 1, limit: 1 } as const;
const USAGE_PRESET = '30d' as const;

export interface ProjectOverviewCounts {
  actions: number;
  apiKeys: number;
  knowledge: number;
  appPages: number;
}

export function useProjectOverview(projectId: string | null) {
  const projectQuery = useProject(projectId);
  const actionsQuery = useProjectActions(projectId, COUNT_QUERY);
  const apiKeysQuery = useProjectApiKeys(projectId, COUNT_QUERY);
  const knowledgeQuery = useProjectKnowledge(projectId, COUNT_QUERY);
  const appPagesQuery = useAppPages(projectId);

  const usageRange = useMemo(() => resolveUsageDateRange(USAGE_PRESET), []);
  const usageSummaryQuery = useProjectUsageSummary(
    projectId,
    usageRange.from,
    usageRange.to,
  );
  const usageBreakdownQuery = useProjectUsageBreakdown(
    projectId,
    usageRange.from,
    usageRange.to,
  );

  const counts: ProjectOverviewCounts = {
    actions: actionsQuery.data?.total ?? 0,
    apiKeys: apiKeysQuery.data?.total ?? 0,
    knowledge: knowledgeQuery.data?.total ?? 0,
    appPages: appPagesQuery.data?.length ?? 0,
  };

  const countsLoading =
    actionsQuery.isLoading ||
    apiKeysQuery.isLoading ||
    knowledgeQuery.isLoading ||
    appPagesQuery.isLoading;

  const usageLoading =
    usageSummaryQuery.isLoading || usageBreakdownQuery.isLoading;
  const usageError =
    usageSummaryQuery.isError || usageBreakdownQuery.isError;

  return {
    projectQuery,
    counts,
    countsLoading,
    usage: {
      summary: usageSummaryQuery.data,
      breakdown: usageBreakdownQuery.data,
      isLoading: usageLoading,
      isError: usageError,
      refetch: () => {
        void usageSummaryQuery.refetch();
        void usageBreakdownQuery.refetch();
      },
    },
  };
}
