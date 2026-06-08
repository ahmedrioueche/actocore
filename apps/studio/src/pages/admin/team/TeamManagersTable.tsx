import type { PlatformManagerData } from '@ahmedrioueche/actocore-shared';
import { Pencil, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { formatPlatformPermissions } from '@/components/admin/team/format-platform-permissions';
import NoData from '@/components/ui/NoData';
import { Table, type TableColumn } from '@/components/ui/Table';
import { useModalStore } from '@/stores/modal';

interface TeamManagersTableProps {
  managers: PlatformManagerData[];
  isLoading: boolean;
  deletePending: boolean;
  onRemove: (manager: PlatformManagerData) => void;
}

export function TeamManagersTable({
  managers,
  isLoading,
  deletePending,
  onRemove,
}: TeamManagersTableProps) {
  const { t } = useTranslation();
  const openConfirm = useModalStore((state) => state.openConfirm);
  const openModal = useModalStore((state) => state.openModal);

  const columns = useMemo<TableColumn<PlatformManagerData>[]>(
    () => [
      {
        key: 'username',
        header: t('admin.team.username'),
        render: (manager) => (
          <div className="min-w-0">
            <p className="font-medium text-text-primary">
              {manager.displayName ?? manager.username}
            </p>
            {manager.displayName ? (
              <p className="mt-0.5 text-xs text-text-secondary">
                @{manager.username}
              </p>
            ) : null}
          </div>
        ),
        renderSkeleton: () => (
          <div className="h-4 w-32 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'role',
        header: t('admin.team.role'),
        width: 'w-32',
        render: (manager) =>
          manager.isMaster ? t('admin.team.master') : t('admin.team.manager'),
        renderSkeleton: () => (
          <div className="h-4 w-20 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'permissions',
        header: t('admin.team.permissions'),
        render: (manager) =>
          manager.isMaster
            ? t('admin.team.allPermissions')
            : formatPlatformPermissions(manager.permissions, t),
        renderSkeleton: () => (
          <div className="h-4 w-48 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'actions',
        header: '',
        width: 'w-28',
        align: 'right',
        render: (manager) =>
          !manager.isMaster ? (
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={() => openModal('editPlatformManager', { manager })}
                className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                aria-label={t('admin.team.editTitle')}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  openConfirm({
                    title: t('admin.team.delete.title'),
                    text: t('admin.team.delete.text', {
                      name: manager.displayName ?? manager.username,
                    }),
                    confirmText: t('admin.team.delete.confirm'),
                    confirmVariant: 'danger',
                    onConfirm: () => onRemove(manager),
                  })
                }
                className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-danger-surface hover:text-danger"
                aria-label={t('admin.team.delete.confirm')}
                disabled={deletePending}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : null,
        renderSkeleton: () => (
          <div className="ms-auto h-8 w-8 animate-pulse rounded-lg bg-surface-hover" />
        ),
      },
    ],
    [deletePending, onRemove, openConfirm, openModal, t],
  );

  return (
    <Table
      columns={columns}
      data={managers}
      keyExtractor={(manager) => manager.userId}
      isLoading={isLoading}
      emptyState={
        <NoData
          title={t('admin.team.emptyTitle')}
          description={t('admin.team.emptyDescription')}
          centered={false}
        />
      }
      renderMobileCard={(manager) => (
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="font-medium text-text-primary">
              {manager.displayName ?? manager.username}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              {manager.isMaster ? t('admin.team.master') : t('admin.team.manager')}
            </p>
          </div>
          {!manager.isMaster ? (
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => openModal('editPlatformManager', { manager })}
                className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                aria-label={t('admin.team.editTitle')}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  openConfirm({
                    title: t('admin.team.delete.title'),
                    text: t('admin.team.delete.text', {
                      name: manager.displayName ?? manager.username,
                    }),
                    confirmText: t('admin.team.delete.confirm'),
                    confirmVariant: 'danger',
                    onConfirm: () => onRemove(manager),
                  })
                }
                className="rounded-lg p-2 text-text-secondary hover:bg-danger-surface hover:text-danger"
                aria-label={t('admin.team.delete.confirm')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      )}
    />
  );
}
