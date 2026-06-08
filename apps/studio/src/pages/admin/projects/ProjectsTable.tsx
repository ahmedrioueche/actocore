import type { PaginationMeta, PlatformProjectListItem } from '@ahmedrioueche/actocore-shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import NoData from '@/components/ui/NoData';
import { PaginatedTable } from '@/components/ui/PaginatedTable';
import type { TableColumn } from '@/components/ui/Table';

interface ProjectsTableProps {
  projects: PlatformProjectListItem[];
  isLoading: boolean;
  meta?: Pick<PaginationMeta, 'page' | 'pageCount' | 'total' | 'limit'>;
  onPageChange: (page: number) => void;
}

export function ProjectsTable({
  projects,
  isLoading,
  meta,
  onPageChange,
}: ProjectsTableProps) {
  const { t } = useTranslation();

  const columns = useMemo<TableColumn<PlatformProjectListItem>[]>(
    () => [
      {
        key: 'name',
        header: t('admin.projects.name'),
        render: (project) => (
          <span className="font-medium text-text-primary">{project.name}</span>
        ),
        renderSkeleton: () => (
          <div className="h-4 w-32 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'account',
        header: t('admin.projects.account'),
        render: (project) => project.accountName,
        renderSkeleton: () => (
          <div className="h-4 w-36 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'archived',
        header: t('admin.projects.archived'),
        width: 'w-28',
        render: (project) => (project.archived ? t('admin.yes') : t('admin.no')),
        renderSkeleton: () => (
          <div className="h-4 w-12 animate-pulse rounded bg-surface-hover" />
        ),
      },
    ],
    [t],
  );

  return (
    <PaginatedTable
      columns={columns}
      data={projects}
      keyExtractor={(project) => project.id}
      isLoading={isLoading}
      meta={meta}
      onPageChange={onPageChange}
      emptyState={
        <NoData
          title={t('admin.projects.emptyTitle')}
          description={t('admin.projects.emptyDescription')}
          centered={false}
        />
      }
      renderMobileCard={(project) => (
        <div className="p-4">
          <p className="font-medium text-text-primary">{project.name}</p>
          <p className="mt-1 text-xs text-text-secondary">{project.accountName}</p>
        </div>
      )}
    />
  );
}
