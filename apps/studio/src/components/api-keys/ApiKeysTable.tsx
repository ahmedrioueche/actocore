import type { ApiKeyMetadata } from '@ahmedrioueche/actocore-shared';
import { KeyRound, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { PaginationState } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/states';
import { DataTable } from '@/components/ui/DataTable';
import { MobileDataCard, MobileDataRow } from '@/components/ui/MobileDataCard';
import { useAuth } from '@/context/AuthContext';
import { useProjectApiKeys, useRevokeApiKey } from '@/hooks/use-api-keys';
import { canWriteApiKeys } from '@/lib/studio-permissions';
import { useModalStore } from '@/stores/modal';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import type { ColumnDef } from '@/types/table';

function formatKeyLabel(key: ApiKeyMetadata): string {
  return key.name?.trim() || key.prefix;
}

interface ApiKeysTableProps {
  projectId: string;
}

export function ApiKeysTable({ projectId }: ApiKeysTableProps) {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const openConfirm = useModalStore((state) => state.openConfirm);
  const openModal = useModalStore((state) => state.openModal);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const keysQuery = useProjectApiKeys(projectId, {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });
  const revokeKey = useRevokeApiKey(projectId);

  const canWrite = canWriteApiKeys(session);
  const keys = keysQuery.data?.items ?? [];

  const columns = useMemo<ColumnDef<ApiKeyMetadata>[]>(() => {
    const formatCreated = (value: string) =>
      new Date(value).toLocaleDateString(i18n.language, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

    const formatLastUsed = (value?: string) =>
      value ? formatCreated(value) : t('apiKeys.neverUsed');

    const cols: ColumnDef<ApiKeyMetadata>[] = [
      {
        id: 'name',
        accessorFn: (row) => formatKeyLabel(row),
        header: t('apiKeys.columns.name'),
        meta: {
          renderSkeleton: () => (
            <div className="h-10 w-40 animate-pulse rounded-lg bg-surface-hover" />
          ),
        },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-text-primary">
              {formatKeyLabel(row.original)}
            </p>
            <p className="truncate font-mono text-xs text-text-secondary">
              {row.original.prefix}…
            </p>
          </div>
        ),
      },
      {
        id: 'created',
        accessorFn: (row) => row.createdAt,
        header: t('apiKeys.columns.created'),
        meta: {
          widthClassName: 'w-36',
          renderSkeleton: () => (
            <div className="h-4 w-24 animate-pulse rounded bg-surface-hover" />
          ),
        },
        cell: ({ row }) => (
          <span className="text-sm text-text-secondary">
            {formatCreated(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'lastUsed',
        accessorFn: (row) => row.lastUsedAt ?? '',
        header: t('apiKeys.columns.lastUsed'),
        meta: {
          widthClassName: 'w-36',
          renderSkeleton: () => (
            <div className="h-4 w-24 animate-pulse rounded bg-surface-hover" />
          ),
        },
        cell: ({ row }) => (
          <span className="text-sm text-text-secondary">
            {formatLastUsed(row.original.lastUsedAt)}
          </span>
        ),
      },
    ];

    if (!canWrite) {
      return cols;
    }

    cols.push({
      id: 'actions',
      header: '',
      enableSorting: false,
      meta: {
        widthClassName: 'w-28',
        align: 'right',
        renderSkeleton: () => (
          <div className="ms-auto h-8 w-16 animate-pulse rounded-lg bg-surface-hover" />
        ),
      },
      cell: ({ row }) => {
        const key = row.original;
        return (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() =>
                openModal('editApiKey', {
                  projectId,
                  keyId: key.id,
                  currentName: key.name ?? '',
                })
              }
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
              aria-label={t('apiKeys.edit.title')}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                openConfirm({
                  title: t('apiKeys.delete.title'),
                  text: t('apiKeys.delete.text', { name: formatKeyLabel(key) }),
                  confirmText: t('apiKeys.delete.confirm'),
                  confirmVariant: 'danger',
                  onConfirm: () => {
                    void revokeKey.mutateAsync(key.id);
                  },
                })
              }
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-danger-surface hover:text-danger"
              aria-label={t('apiKeys.delete.confirm')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    });

    return cols;
  }, [canWrite, i18n.language, openConfirm, openModal, projectId, revokeKey, t]);

  return (
    <DataTable
      columns={columns}
      data={keys}
      isLoading={keysQuery.isLoading}
      isError={keysQuery.isError}
      onRetry={() => void keysQuery.refetch()}
      getRowId={(key) => key.id}
      manualPagination
      pagination={pagination}
      onPaginationChange={setPagination}
      pageCount={keysQuery.data?.pageCount ?? 0}
      rowCount={keysQuery.data?.total ?? 0}
      emptyState={
        <EmptyState
          icon={KeyRound}
          title={t('projectPages.sections.apiKeys.emptyTitle')}
          description={t('projectPages.sections.apiKeys.emptyDescription')}
        />
      }
      renderMobileCard={(key) => {
        const formatCreated = (value: string) =>
          new Date(value).toLocaleDateString(i18n.language, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

        const actions = canWrite ? (
          <>
            <button
              type="button"
              onClick={() =>
                openModal('editApiKey', {
                  projectId,
                  keyId: key.id,
                  currentName: key.name ?? '',
                })
              }
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
              aria-label={t('apiKeys.edit.title')}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                openConfirm({
                  title: t('apiKeys.delete.title'),
                  text: t('apiKeys.delete.text', { name: formatKeyLabel(key) }),
                  confirmText: t('apiKeys.delete.confirm'),
                  confirmVariant: 'danger',
                  onConfirm: () => {
                    void revokeKey.mutateAsync(key.id);
                  },
                })
              }
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-danger-surface hover:text-danger"
              aria-label={t('apiKeys.delete.confirm')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        ) : undefined;

        return (
          <MobileDataCard
            actions={actions}
            footer={
              <>
                <MobileDataRow
                  label={t('apiKeys.columns.created')}
                  value={formatCreated(key.createdAt)}
                />
                <MobileDataRow
                  label={t('apiKeys.columns.lastUsed')}
                  value={
                    key.lastUsedAt
                      ? formatCreated(key.lastUsedAt)
                      : t('apiKeys.neverUsed')
                  }
                />
              </>
            }
          >
            <p className="truncate font-medium text-text-primary">
              {formatKeyLabel(key)}
            </p>
            <p className="mt-1 truncate font-mono text-xs text-text-secondary">
              {key.prefix}…
            </p>
          </MobileDataCard>
        );
      }}
    />
  );
}
