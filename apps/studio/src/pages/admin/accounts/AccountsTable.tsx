import type { PlatformAccountListItemData } from '@ahmedrioueche/actocore-shared';
import { Link } from '@tanstack/react-router';
import type { PaginationMeta } from '@ahmedrioueche/actocore-shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import NoData from '@/components/ui/NoData';
import { PaginatedTable } from '@/components/ui/PaginatedTable';
import type { TableColumn } from '@/components/ui/Table';

interface AccountsTableProps {
  accounts: PlatformAccountListItemData[];
  isLoading: boolean;
  meta?: Pick<PaginationMeta, 'page' | 'pageCount' | 'total' | 'limit'>;
  onPageChange: (page: number) => void;
}

export function AccountsTable({
  accounts,
  isLoading,
  meta,
  onPageChange,
}: AccountsTableProps) {
  const { t, i18n } = useTranslation();

  const columns = useMemo<TableColumn<PlatformAccountListItemData>[]>(
    () => [
      {
        key: 'name',
        header: t('admin.accounts.name'),
        render: (account) => (
          <Link
            to="/admin/accounts/$accountId"
            params={{ accountId: account.id }}
            className="font-medium text-primary hover:underline"
          >
            {account.name}
          </Link>
        ),
        renderSkeleton: () => (
          <div className="h-4 w-32 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'plan',
        header: t('admin.accounts.plan'),
        render: (account) => account.planId ?? '—',
        renderSkeleton: () => (
          <div className="h-4 w-20 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'billingEmail',
        header: t('admin.accounts.billingEmail'),
        render: (account) => account.billingEmail ?? '—',
        renderSkeleton: () => (
          <div className="h-4 w-40 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'created',
        header: t('admin.accounts.created'),
        width: 'w-32',
        render: (account) =>
          new Date(account.createdAt).toLocaleDateString(i18n.language),
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
      data={accounts}
      keyExtractor={(account) => account.id}
      isLoading={isLoading}
      meta={meta}
      onPageChange={onPageChange}
      emptyState={
        <NoData
          title={t('admin.accounts.emptyTitle')}
          description={t('admin.accounts.emptyDescription')}
          centered={false}
        />
      }
      renderMobileCard={(account) => (
        <div className="p-4">
          <Link
            to="/admin/accounts/$accountId"
            params={{ accountId: account.id }}
            className="font-medium text-primary"
          >
            {account.name}
          </Link>
          <p className="mt-1 text-xs text-text-secondary">
            {account.planId ?? '—'}
          </p>
        </div>
      )}
    />
  );
}
