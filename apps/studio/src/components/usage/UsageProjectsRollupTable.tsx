import type { AccountUsageProjectRow } from '@ahmedrioueche/actocore-shared';
import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { AnalyticsPanel } from '@/components/admin/analytics/AnalyticsPanel';
import { formatCompactNumber } from '@/components/admin/analytics/format-analytics';
import NoData from '@/components/ui/NoData';
import { Table, type TableColumn } from '@/components/ui/Table';

interface UsageProjectsRollupTableProps {
  projects: AccountUsageProjectRow[];
  isLoading?: boolean;
}

export function UsageProjectsRollupTable({
  projects,
  isLoading = false,
}: UsageProjectsRollupTableProps) {
  const { t, i18n } = useTranslation();

  const columns = useMemo(
    () =>
      [
        {
          key: 'name',
          header: t('usage.projectsTable.name'),
          render: (row) => (
            <Link
              to="/projects/$projectId/usage"
              params={{ projectId: row.projectId }}
              className="font-medium text-primary hover:underline"
            >
              {row.projectName}
            </Link>
          ),
          renderSkeleton: () => (
            <div className="h-4 w-32 animate-pulse rounded bg-surface-hover" />
          ),
        },
        {
          key: 'requests',
          header: t('usage.projectsTable.requests'),
          width: 'w-28',
          align: 'right' as const,
          render: (row) =>
            formatCompactNumber(row.totalRequests, i18n.language),
          renderSkeleton: () => (
            <div className="ms-auto h-4 w-12 animate-pulse rounded bg-surface-hover" />
          ),
        },
        {
          key: 'tokens',
          header: t('usage.projectsTable.tokens'),
          width: 'w-32',
          align: 'right' as const,
          render: (row) =>
            formatCompactNumber(
              row.totalPromptTokens + row.totalCompletionTokens,
              i18n.language,
            ),
          renderSkeleton: () => (
            <div className="ms-auto h-4 w-16 animate-pulse rounded bg-surface-hover" />
          ),
        },
      ] satisfies TableColumn<AccountUsageProjectRow>[],
    [i18n.language, t],
  );

  return (
    <AnalyticsPanel
      title={t('usage.projectsTable.title')}
      description={t('usage.projectsTable.description')}
    >
      <Table
        columns={columns}
        data={projects}
        keyExtractor={(row) => row.projectId}
        isLoading={isLoading}
        skeletonRowCount={5}
        emptyState={<NoData title={t('usage.projectsTable.empty')} />}
      />
    </AnalyticsPanel>
  );
}
