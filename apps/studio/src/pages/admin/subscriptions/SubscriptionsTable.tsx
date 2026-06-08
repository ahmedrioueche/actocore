import type {
  PaginationMeta,
  PlatformSubscriptionListItem,
} from '@ahmedrioueche/actocore-shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import NoData from '@/components/ui/NoData';
import { PaginatedTable } from '@/components/ui/PaginatedTable';
import type { TableColumn } from '@/components/ui/Table';

interface SubscriptionsTableProps {
  subscriptions: PlatformSubscriptionListItem[];
  isLoading: boolean;
  meta?: Pick<PaginationMeta, 'page' | 'pageCount' | 'total' | 'limit'>;
  onPageChange: (page: number) => void;
}

export function SubscriptionsTable({
  subscriptions,
  isLoading,
  meta,
  onPageChange,
}: SubscriptionsTableProps) {
  const { t } = useTranslation();

  const columns = useMemo<TableColumn<PlatformSubscriptionListItem>[]>(
    () => [
      {
        key: 'account',
        header: t('admin.subscriptions.account'),
        render: (sub) => sub.accountName,
        renderSkeleton: () => (
          <div className="h-4 w-36 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'plan',
        header: t('admin.subscriptions.plan'),
        render: (sub) => sub.planId,
        renderSkeleton: () => (
          <div className="h-4 w-24 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'status',
        header: t('admin.subscriptions.status'),
        render: (sub) => sub.status,
        renderSkeleton: () => (
          <div className="h-4 w-20 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'provider',
        header: t('admin.subscriptions.provider'),
        render: (sub) => sub.provider,
        renderSkeleton: () => (
          <div className="h-4 w-20 animate-pulse rounded bg-surface-hover" />
        ),
      },
    ],
    [t],
  );

  return (
    <PaginatedTable
      columns={columns}
      data={subscriptions}
      keyExtractor={(sub) => sub.id}
      isLoading={isLoading}
      meta={meta}
      onPageChange={onPageChange}
      emptyState={
        <NoData
          title={t('admin.subscriptions.emptyTitle')}
          description={t('admin.subscriptions.emptyDescription')}
          centered={false}
        />
      }
      renderMobileCard={(sub) => (
        <div className="p-4">
          <p className="font-medium text-text-primary">{sub.accountName}</p>
          <p className="mt-1 text-xs text-text-secondary">
            {sub.planId} · {sub.status}
          </p>
        </div>
      )}
    />
  );
}
