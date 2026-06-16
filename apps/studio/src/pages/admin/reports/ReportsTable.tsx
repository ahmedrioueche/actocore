import type {
  PaginationMeta,
  PlatformReportListItem,
} from '@ahmedrioueche/actocore-shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import NoData from '@/components/ui/NoData';
import { PaginatedTable } from '@/components/ui/PaginatedTable';
import type { TableColumn } from '@/components/ui/Table';
import { useModalStore } from '@/stores/modal';

interface AdminReportsTableProps {
  reports: PlatformReportListItem[];
  isLoading: boolean;
  meta?: Pick<PaginationMeta, 'page' | 'pageCount' | 'total' | 'limit'>;
  onPageChange: (page: number) => void;
}

export function AdminReportsTable({
  reports,
  isLoading,
  meta,
  onPageChange,
}: AdminReportsTableProps) {
  const { t, i18n } = useTranslation();
  const openModal = useModalStore((state) => state.openModal);

  const columns = useMemo<TableColumn<PlatformReportListItem>[]>(
    () => [
      {
        key: 'created',
        header: t('reports.fields.created'),
        width: 'w-32',
        render: (report) =>
          new Date(report.createdAt).toLocaleDateString(i18n.language),
        renderSkeleton: () => (
          <div className="h-4 w-24 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'type',
        header: t('reports.fields.type'),
        width: 'w-28',
        render: (report) => t(`reports.types.${report.type}`),
        renderSkeleton: () => (
          <div className="h-4 w-20 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'account',
        header: t('reports.fields.workspace'),
        render: (report) => report.accountName,
        renderSkeleton: () => (
          <div className="h-4 w-32 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'reporter',
        header: t('reports.fields.reporter'),
        render: (report) =>
          report.reporterDisplayName ??
          report.reporterEmail ??
          report.reporterUserId,
        renderSkeleton: () => (
          <div className="h-4 w-36 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'subject',
        header: t('reports.fields.subject'),
        render: (report) => report.subject?.trim() || t('reports.noSubject'),
        renderSkeleton: () => (
          <div className="h-4 w-40 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'status',
        header: t('reports.fields.status'),
        width: 'w-28',
        render: (report) => t(`reports.status.${report.status}`),
        renderSkeleton: () => (
          <div className="h-4 w-20 animate-pulse rounded bg-surface-hover" />
        ),
      },
    ],
    [i18n.language, t],
  );

  return (
    <PaginatedTable
      columns={columns}
      data={reports}
      keyExtractor={(report) => report.id}
      isLoading={isLoading}
      meta={meta}
      onPageChange={onPageChange}
      onRowClick={(report) => openModal('editReport', { reportId: report.id })}
      emptyState={
        <NoData
          title={t('admin.reports.emptyTitle')}
          description={t('admin.reports.emptyDescription')}
          centered={false}
        />
      }
      renderMobileCard={(report) => (
        <button
          type="button"
          className="w-full p-4 text-left"
          onClick={() => openModal('editReport', { reportId: report.id })}
        >
          <p className="font-medium text-text-primary">{report.accountName}</p>
          <p className="mt-1 text-xs text-text-secondary">
            {report.subject?.trim() || t('reports.noSubject')} ·{' '}
            {t(`reports.status.${report.status}`)}
          </p>
        </button>
      )}
    />
  );
}
