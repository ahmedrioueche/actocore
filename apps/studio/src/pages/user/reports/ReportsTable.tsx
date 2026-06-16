import type { PaginationMeta, StudioReportData } from '@ahmedrioueche/actocore-shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import NoData from '@/components/ui/NoData';
import { PaginatedTable } from '@/components/ui/PaginatedTable';
import type { TableColumn } from '@/components/ui/Table';
import { useModalStore } from '@/stores/modal';

interface ReportsTableProps {
  reports: StudioReportData[];
  isLoading: boolean;
  meta?: Pick<PaginationMeta, 'page' | 'pageCount' | 'total' | 'limit'>;
  onPageChange: (page: number) => void;
}

export function ReportsTable({
  reports,
  isLoading,
  meta,
  onPageChange,
}: ReportsTableProps) {
  const { t, i18n } = useTranslation();
  const openModal = useModalStore((state) => state.openModal);

  const columns = useMemo<TableColumn<StudioReportData>[]>(
    () => [
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
        key: 'subject',
        header: t('reports.fields.subject'),
        render: (report) => report.subject?.trim() || t('reports.noSubject'),
        renderSkeleton: () => (
          <div className="h-4 w-48 animate-pulse rounded bg-surface-hover" />
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
      {
        key: 'created',
        header: t('reports.fields.created'),
        width: 'w-36',
        render: (report) =>
          new Date(report.createdAt).toLocaleDateString(i18n.language),
        renderSkeleton: () => (
          <div className="h-4 w-24 animate-pulse rounded bg-surface-hover" />
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
      onRowClick={(report) => openModal('viewReport', { reportId: report.id })}
      emptyState={
        <NoData
          title={t('reports.emptyTitle')}
          description={t('reports.emptyDescription')}
          centered={false}
        />
      }
      renderMobileCard={(report) => (
        <button
          type="button"
          className="w-full p-4 text-left"
          onClick={() => openModal('viewReport', { reportId: report.id })}
        >
          <p className="font-medium text-text-primary">
            {report.subject?.trim() || t('reports.noSubject')}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {t(`reports.types.${report.type}`)} ·{' '}
            {t(`reports.status.${report.status}`)}
          </p>
        </button>
      )}
    />
  );
}
