import type { StudioBillingHistoryEntry } from '@ahmedrioueche/actocore-shared';
import { useTranslation } from 'react-i18next';

import NoData from '@/components/ui/NoData';
import { Table, type TableColumn } from '@/components/ui/Table';

interface PaymentHistoryTableProps {
  items: StudioBillingHistoryEntry[];
  isLoading: boolean;
}

export function PaymentHistoryTable({
  items,
  isLoading,
}: PaymentHistoryTableProps) {
  const { t, i18n } = useTranslation();

  const columns: TableColumn<StudioBillingHistoryEntry>[] = [
    {
      key: 'date',
      header: t('billing.history.columns.date'),
      render: (entry) =>
        new Date(entry.createdAt).toLocaleDateString(i18n.language, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      renderSkeleton: () => (
        <div className="h-4 w-24 animate-pulse rounded bg-surface-hover" />
      ),
    },
    {
      key: 'action',
      header: t('billing.history.columns.action'),
      render: (entry) => (
        <span className="font-medium text-text-primary">{entry.action}</span>
      ),
      renderSkeleton: () => (
        <div className="h-4 w-20 animate-pulse rounded bg-surface-hover" />
      ),
    },
    {
      key: 'details',
      header: t('billing.history.columns.details'),
      render: (entry) => (
        <span className="text-text-secondary">{entry.details ?? '—'}</span>
      ),
      renderSkeleton: () => (
        <div className="h-4 w-40 animate-pulse rounded bg-surface-hover" />
      ),
    },
    {
      key: 'amount',
      header: t('billing.history.columns.amount'),
      width: 'w-28',
      align: 'right',
      render: (entry) =>
        entry.amountPaid != null && entry.currency
          ? new Intl.NumberFormat(i18n.language, {
              style: 'currency',
              currency: entry.currency,
            }).format(entry.amountPaid)
          : '—',
      renderSkeleton: () => (
        <div className="ml-auto h-4 w-16 animate-pulse rounded bg-surface-hover" />
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={items}
      isLoading={isLoading}
      keyExtractor={(entry) => entry.id}
      emptyState={
        <NoData
          title={t('billing.history.empty')}
          description={t('billing.history.emptyDescription')}
          centered={false}
        />
      }
    />
  );
}
