import type { AppPageData } from '@ahmedrioueche/actocore-shared';
import { Map, Pencil, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/states';
import { DataTable } from '@/components/ui/DataTable';
import { MobileDataCard, MobileDataRow } from '@/components/ui/MobileDataCard';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { useAuth } from '@/context/AuthContext';
import {
  useAppPages,
  useDeleteAppPage,
  useUpdateAppPage,
} from '@/hooks/use-app-pages';
import { canWriteActions } from '@/lib/studio-permissions';
import { useModalStore } from '@/stores/modal';
import type { ColumnDef } from '@/types/table';

interface AppPagesTableProps {
  projectId: string;
}

export function AppPagesTable({ projectId }: AppPagesTableProps) {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const openConfirm = useModalStore((state) => state.openConfirm);
  const openModal = useModalStore((state) => state.openModal);

  const pagesQuery = useAppPages(projectId);
  const updatePage = useUpdateAppPage(projectId);
  const deletePage = useDeleteAppPage(projectId);

  const canWrite = canWriteActions(session);
  const pages = pagesQuery.data ?? [];

  const columns = useMemo<ColumnDef<AppPageData>[]>(() => {
    const formatDate = (value: string) =>
      new Date(value).toLocaleDateString(i18n.language, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

    const cols: ColumnDef<AppPageData>[] = [
      {
        id: 'page',
        accessorFn: (row) => row.title,
        header: t('projectLayout.columns.page'),
        meta: {
          renderSkeleton: () => (
            <div className="h-9 w-48 animate-pulse rounded-lg bg-surface-hover" />
          ),
        },
        cell: ({ row }) => {
          const page = row.original;
          return (
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-text-secondary">
                <Map className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-text-primary">
                  {page.title}
                </p>
                <p className="truncate font-mono text-xs text-text-secondary">
                  {page.slug}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'route',
        accessorFn: (row) => row.route,
        header: t('projectLayout.columns.route'),
        meta: {
          widthClassName: 'w-40',
          renderSkeleton: () => (
            <div className="h-4 w-28 animate-pulse rounded bg-surface-hover" />
          ),
        },
        cell: ({ row }) => (
          <span className="font-mono text-sm text-text-primary">
            {row.original.route}
          </span>
        ),
      },
      {
        id: 'actions',
        accessorFn: (row) => row.actionCount ?? 0,
        header: t('projectLayout.columns.actions'),
        meta: {
          widthClassName: 'w-24',
          renderSkeleton: () => (
            <div className="h-4 w-8 animate-pulse rounded bg-surface-hover" />
          ),
        },
        cell: ({ row }) => (
          <span className="text-sm text-text-primary">
            {row.original.actionCount ?? 0}
          </span>
        ),
      },
      {
        id: 'functionalities',
        accessorFn: (row) => row.functionalities?.length ?? 0,
        header: t('projectLayout.columns.functionalities'),
        meta: {
          widthClassName: 'w-28',
          renderSkeleton: () => (
            <div className="h-4 w-8 animate-pulse rounded bg-surface-hover" />
          ),
        },
        cell: ({ row }) => (
          <span className="text-sm text-text-primary">
            {row.original.functionalities?.length ?? 0}
          </span>
        ),
      },
      {
        id: 'status',
        accessorFn: (row) => row.enabled,
        header: t('projectLayout.columns.status'),
        meta: {
          widthClassName: 'w-32',
          renderSkeleton: () => (
            <div className="h-6 w-16 animate-pulse rounded-full bg-surface-hover" />
          ),
        },
        cell: ({ row }) => {
          const page = row.original;
          if (canWrite) {
            return (
              <ToggleSwitch
                checked={page.enabled}
                ariaLabel={
                  page.enabled
                    ? t('projectLayout.fields.disablePage')
                    : t('projectLayout.fields.enablePage')
                }
                onChange={(next) => {
                  updatePage.mutate({
                    pageId: page.id,
                    body: { enabled: next },
                  });
                }}
              />
            );
          }
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                page.enabled
                  ? 'bg-success/10 text-success'
                  : 'bg-surface-hover text-text-secondary'
              }`}
            >
              {page.enabled
                ? t('projectActions.status.enabled')
                : t('projectActions.status.disabled')}
            </span>
          );
        },
      },
      {
        id: 'updated',
        accessorFn: (row) => row.updatedAt,
        header: t('projectLayout.columns.updated'),
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
      id: 'rowActions',
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
        const page = row.original;
        return (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() =>
                openModal('editAppPage', { projectId, pageId: page.id })
              }
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
              aria-label={t('projectLayout.edit.title')}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                openConfirm({
                  title: t('projectLayout.delete.title'),
                  text: t('projectLayout.delete.text', { title: page.title }),
                  confirmText: t('projectLayout.delete.confirm'),
                  confirmVariant: 'danger',
                  onConfirm: () => {
                    void deletePage.mutateAsync(page.id);
                  },
                })
              }
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-danger-surface hover:text-danger"
              aria-label={t('projectLayout.delete.confirm')}
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
    deletePage,
    i18n.language,
    openConfirm,
    openModal,
    projectId,
    t,
    updatePage,
  ]);

  return (
    <DataTable
      columns={columns}
      data={pages}
      isLoading={pagesQuery.isLoading}
      isError={pagesQuery.isError}
      onRetry={() => void pagesQuery.refetch()}
      getRowId={(page) => page.id}
      emptyState={
        <EmptyState
          icon={Map}
          title={t('projectPages.sections.layout.emptyTitle')}
          description={t('projectPages.sections.layout.emptyDescription')}
        />
      }
      renderMobileCard={(page) => {
        const formatDate = (value: string) =>
          new Date(value).toLocaleDateString(i18n.language, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

        const statusControl = canWrite ? (
          <ToggleSwitch
            checked={page.enabled}
            ariaLabel={
              page.enabled
                ? t('projectLayout.fields.disablePage')
                : t('projectLayout.fields.enablePage')
            }
            onChange={(next) => {
              updatePage.mutate({
                pageId: page.id,
                body: { enabled: next },
              });
            }}
          />
        ) : (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              page.enabled
                ? 'bg-success/10 text-success'
                : 'bg-surface-hover text-text-secondary'
            }`}
          >
            {page.enabled
              ? t('projectActions.status.enabled')
              : t('projectActions.status.disabled')}
          </span>
        );

        const rowActions = canWrite ? (
          <>
            <button
              type="button"
              onClick={() =>
                openModal('editAppPage', { projectId, pageId: page.id })
              }
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
              aria-label={t('projectLayout.edit.title')}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                openConfirm({
                  title: t('projectLayout.delete.title'),
                  text: t('projectLayout.delete.text', { title: page.title }),
                  confirmText: t('projectLayout.delete.confirm'),
                  confirmVariant: 'danger',
                  onConfirm: () => {
                    void deletePage.mutateAsync(page.id);
                  },
                })
              }
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-danger-surface hover:text-danger"
              aria-label={t('projectLayout.delete.confirm')}
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
                  label={t('projectLayout.columns.route')}
                  value={
                    <span className="font-mono text-sm">{page.route}</span>
                  }
                />
                <MobileDataRow
                  label={t('projectLayout.columns.actions')}
                  value={String(page.actionCount ?? 0)}
                />
                <MobileDataRow
                  label={t('projectLayout.columns.status')}
                  value={statusControl}
                />
                <MobileDataRow
                  label={t('projectLayout.columns.updated')}
                  value={formatDate(page.updatedAt)}
                />
              </>
            }
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-text-secondary">
                <Map className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-text-primary">
                  {page.title}
                </p>
                <p className="truncate font-mono text-xs text-text-secondary">
                  {page.slug}
                </p>
              </div>
            </div>
          </MobileDataCard>
        );
      }}
    />
  );
}
