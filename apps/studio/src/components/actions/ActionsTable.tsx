import type { ActionData } from '@ahmedrioueche/actocore-shared';
import type { PaginationState } from '@tanstack/react-table';
import { Pencil, Trash2, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/states';
import { DataTable } from '@/components/ui/DataTable';
import { MobileDataCard, MobileDataRow } from '@/components/ui/MobileDataCard';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { useAuth } from '@/context/AuthContext';
import {
  useDeleteAction,
  useProjectActions,
  useUpdateAction,
} from '@/hooks/use-actions';
import { useAppPages } from '@/hooks/use-app-pages';
import { canWriteActions } from '@/lib/studio-permissions';
import { useModalStore } from '@/stores/modal';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import type { ColumnDef } from '@/types/table';

interface ActionsTableProps {
  projectId: string;
  /** Section filter; `uncategorized` sentinel or a section id, or undefined for all. */
  sectionId?: string;
}

export function ActionsTable({ projectId, sectionId }: ActionsTableProps) {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const openConfirm = useModalStore((state) => state.openConfirm);
  const openModal = useModalStore((state) => state.openModal);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [sectionId]);

  const actionsQuery = useProjectActions(projectId, {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    sectionId,
  });
  const updateAction = useUpdateAction(projectId);
  const deleteAction = useDeleteAction(projectId);
  const pagesQuery = useAppPages(projectId);

  const pageTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const page of pagesQuery.data ?? []) {
      map.set(page.id, page.title);
    }
    return map;
  }, [pagesQuery.data]);

  const canWrite = canWriteActions(session);
  const actions = actionsQuery.data?.items ?? [];

  const columns = useMemo<ColumnDef<ActionData>[]>(() => {
    const formatDate = (value: string) =>
      new Date(value).toLocaleDateString(i18n.language, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

    const cols: ColumnDef<ActionData>[] = [
      {
        id: 'name',
        accessorFn: (row) => row.name,
        header: t('projectActions.columns.name'),
        meta: {
          renderSkeleton: () => (
            <div className="h-9 w-48 animate-pulse rounded-lg bg-surface-hover" />
          ),
        },
        cell: ({ row }) => {
          const action = row.original;
          return (
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-text-secondary">
                <Zap className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-medium text-text-primary">
                  {action.name}
                </p>
                {action.description ? (
                  <p className="truncate text-xs text-text-secondary">
                    {action.description}
                  </p>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        id: 'pages',
        accessorFn: (row) => row.pageIds?.join(',') ?? '',
        header: t('projectActions.columns.pages'),
        meta: {
          widthClassName: 'w-40',
          renderSkeleton: () => (
            <div className="h-4 w-24 animate-pulse rounded bg-surface-hover" />
          ),
        },
        cell: ({ row }) => {
          const labels =
            row.original.pageIds
              ?.map((id) => pageTitleById.get(id))
              .filter((label): label is string => Boolean(label)) ?? [];
          if (labels.length === 0) {
            return (
              <span className="text-sm text-text-secondary">
                {t('projectActions.fields.pagesEmpty')}
              </span>
            );
          }
          return (
            <span className="text-sm text-text-primary">{labels.join(', ')}</span>
          );
        },
      },
      {
        id: 'status',
        accessorFn: (row) => row.enabled,
        header: t('projectActions.columns.status'),
        meta: {
          widthClassName: 'w-32',
          renderSkeleton: () => (
            <div className="h-6 w-16 animate-pulse rounded-full bg-surface-hover" />
          ),
        },
        cell: ({ row }) => {
          const action = row.original;
          if (canWrite) {
            return (
              <ToggleSwitch
                checked={action.enabled}
                ariaLabel={
                  action.enabled
                    ? t('projectActions.status.disable')
                    : t('projectActions.status.enable')
                }
                onChange={(next) => {
                  updateAction.mutate({
                    actionId: action.id,
                    body: { enabled: next },
                  });
                }}
              />
            );
          }
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                action.enabled
                  ? 'bg-success/10 text-success'
                  : 'bg-surface-hover text-text-secondary'
              }`}
            >
              {action.enabled
                ? t('projectActions.status.enabled')
                : t('projectActions.status.disabled')}
            </span>
          );
        },
      },
      {
        id: 'updated',
        accessorFn: (row) => row.updatedAt,
        header: t('projectActions.columns.updated'),
        meta: {
          widthClassName: 'w-32',
          renderSkeleton: () => (
            <div className="h-4 w-20 animate-pulse rounded bg-surface-hover" />
          ),
        },
        cell: ({ row }) => (
          <span className="text-sm text-text-secondary">
            {formatDate(row.original.updatedAt)}
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
        const action = row.original;
        return (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() =>
                openModal('editAction', { projectId, actionId: action.id })
              }
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
              aria-label={t('projectActions.edit.title')}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                openConfirm({
                  title: t('projectActions.delete.title'),
                  text: t('projectActions.delete.text', { name: action.name }),
                  confirmText: t('projectActions.delete.confirm'),
                  confirmVariant: 'danger',
                  onConfirm: () => {
                    void deleteAction.mutateAsync(action.id);
                  },
                })
              }
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-danger-surface hover:text-danger"
              aria-label={t('projectActions.delete.confirm')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    });

    return cols;
  }, [
    canWrite,
    deleteAction,
    i18n.language,
    openConfirm,
    openModal,
    projectId,
    pageTitleById,
    t,
    updateAction,
  ]);

  return (
    <DataTable
      columns={columns}
      data={actions}
      isLoading={actionsQuery.isLoading}
      isError={actionsQuery.isError}
      onRetry={() => void actionsQuery.refetch()}
      getRowId={(action) => action.id}
      manualPagination
      pagination={pagination}
      onPaginationChange={setPagination}
      pageCount={actionsQuery.data?.pageCount ?? 0}
      rowCount={actionsQuery.data?.total ?? 0}
      emptyState={
        <EmptyState
          icon={Zap}
          title={t('projectPages.sections.actions.emptyTitle')}
          description={t('projectPages.sections.actions.emptyDescription')}
        />
      }
      renderMobileCard={(action) => {
        const formatDate = (value: string) =>
          new Date(value).toLocaleDateString(i18n.language, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

        const statusControl = canWrite ? (
          <ToggleSwitch
            checked={action.enabled}
            ariaLabel={
              action.enabled
                ? t('projectActions.status.disable')
                : t('projectActions.status.enable')
            }
            onChange={(next) => {
              updateAction.mutate({
                actionId: action.id,
                body: { enabled: next },
              });
            }}
          />
        ) : (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              action.enabled
                ? 'bg-success/10 text-success'
                : 'bg-surface-hover text-text-secondary'
            }`}
          >
            {action.enabled
              ? t('projectActions.status.enabled')
              : t('projectActions.status.disabled')}
          </span>
        );

        const rowActions = canWrite ? (
          <>
            <button
              type="button"
              onClick={() =>
                openModal('editAction', { projectId, actionId: action.id })
              }
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
              aria-label={t('projectActions.edit.title')}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                openConfirm({
                  title: t('projectActions.delete.title'),
                  text: t('projectActions.delete.text', { name: action.name }),
                  confirmText: t('projectActions.delete.confirm'),
                  confirmVariant: 'danger',
                  onConfirm: () => {
                    void deleteAction.mutateAsync(action.id);
                  },
                })
              }
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-danger-surface hover:text-danger"
              aria-label={t('projectActions.delete.confirm')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        ) : undefined;

        return (
          <MobileDataCard
            actions={rowActions}
            footer={
              <>
                <MobileDataRow
                  label={t('projectActions.columns.status')}
                  value={statusControl}
                />
                <MobileDataRow
                  label={t('projectActions.columns.updated')}
                  value={formatDate(action.updatedAt)}
                />
              </>
            }
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-text-secondary">
                <Zap className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-medium text-text-primary">
                  {action.name}
                </p>
                {action.description ? (
                  <p className="truncate text-xs text-text-secondary">
                    {action.description}
                  </p>
                ) : null}
              </div>
            </div>
          </MobileDataCard>
        );
      }}
    />
  );
}
