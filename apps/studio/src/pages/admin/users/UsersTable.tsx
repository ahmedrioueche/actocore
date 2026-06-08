import type { PaginationMeta, PlatformUserListItem } from '@ahmedrioueche/actocore-shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import NoData from '@/components/ui/NoData';
import { PaginatedTable } from '@/components/ui/PaginatedTable';
import type { TableColumn } from '@/components/ui/Table';

interface UsersTableProps {
  users: PlatformUserListItem[];
  isLoading: boolean;
  meta?: Pick<PaginationMeta, 'page' | 'pageCount' | 'total' | 'limit'>;
  onPageChange: (page: number) => void;
}

export function UsersTable({
  users,
  isLoading,
  meta,
  onPageChange,
}: UsersTableProps) {
  const { t, i18n } = useTranslation();

  const columns = useMemo<TableColumn<PlatformUserListItem>[]>(
    () => [
      {
        key: 'identity',
        header: t('admin.users.identity'),
        render: (user) =>
          user.displayName ?? user.email ?? user.platformLoginName ?? user.id,
        renderSkeleton: () => (
          <div className="h-4 w-40 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'memberships',
        header: t('admin.users.memberships'),
        width: 'w-32',
        align: 'center',
        render: (user) => user.membershipCount,
        renderSkeleton: () => (
          <div className="mx-auto h-4 w-8 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'created',
        header: t('admin.users.created'),
        width: 'w-32',
        render: (user) => new Date(user.createdAt).toLocaleDateString(i18n.language),
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
      data={users}
      keyExtractor={(user) => user.id}
      isLoading={isLoading}
      meta={meta}
      onPageChange={onPageChange}
      emptyState={
        <NoData
          title={t('admin.users.emptyTitle')}
          description={t('admin.users.emptyDescription')}
          centered={false}
        />
      }
      renderMobileCard={(user) => (
        <div className="p-4">
          <p className="font-medium text-text-primary">
            {user.displayName ?? user.email ?? user.platformLoginName ?? user.id}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {t('admin.users.memberships')}: {user.membershipCount}
          </p>
        </div>
      )}
    />
  );
}
