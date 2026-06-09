import type {
  KnowledgeSourceData,
  KnowledgeSourceStatus,
} from '@ahmedrioueche/actocore-shared';
import { BookOpen, FileText, Globe, Trash2, Type } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { PaginationState } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/states';
import { DataTable } from '@/components/ui/DataTable';
import { MobileDataCard, MobileDataRow } from '@/components/ui/MobileDataCard';
import { formatBytes } from '@/constants/knowledge';
import { useAuth } from '@/context/AuthContext';
import {
  useDeleteKnowledge,
  useProjectKnowledge,
} from '@/hooks/use-knowledge';
import { canDeleteKnowledge } from '@/lib/studio-permissions';
import { useModalStore } from '@/stores/modal';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import type { ColumnDef } from '@/types/table';

const STATUS_STYLES: Record<KnowledgeSourceStatus, string> = {
  ready: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  error: 'bg-danger/10 text-danger',
};

const TYPE_ICONS = {
  document: FileText,
  url: Globe,
  text: Type,
} as const;

interface KnowledgeTableProps {
  projectId: string;
}

export function KnowledgeTable({ projectId }: KnowledgeTableProps) {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const openConfirm = useModalStore((state) => state.openConfirm);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const knowledgeQuery = useProjectKnowledge(projectId, {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });
  const deleteKnowledge = useDeleteKnowledge(projectId);

  const canDelete = canDeleteKnowledge(session);
  const sources = knowledgeQuery.data?.items ?? [];

  const columns = useMemo<ColumnDef<KnowledgeSourceData>[]>(() => {
    const formatCreated = (value: string) =>
      new Date(value).toLocaleDateString(i18n.language, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

    const cols: ColumnDef<KnowledgeSourceData>[] = [
      {
        id: 'title',
        accessorFn: (row) => row.title,
        header: t('knowledge.columns.source'),
        meta: {
          renderSkeleton: () => (
            <div className="h-9 w-48 animate-pulse rounded-lg bg-surface-hover" />
          ),
        },
        cell: ({ row }) => {
          const source = row.original;
          const Icon = TYPE_ICONS[source.type] ?? FileText;
          const subtitle =
            source.file?.originalFilename ??
            source.url ??
            t(`knowledge.types.${source.type}`);
          return (
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-text-secondary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-text-primary">
                  {source.title}
                </p>
                <p className="truncate text-xs text-text-secondary">
                  {subtitle}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: t('knowledge.columns.status'),
        meta: {
          widthClassName: 'w-32',
          renderSkeleton: () => (
            <div className="h-6 w-16 animate-pulse rounded-full bg-surface-hover" />
          ),
        },
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[row.original.status]}`}
          >
            {t(`knowledge.status.${row.original.status}`)}
          </span>
        ),
      },
      {
        id: 'size',
        accessorFn: (row) => row.file?.byteSize ?? 0,
        header: t('knowledge.columns.size'),
        meta: {
          widthClassName: 'w-28',
          renderSkeleton: () => (
            <div className="h-4 w-16 animate-pulse rounded bg-surface-hover" />
          ),
        },
        cell: ({ row }) => (
          <span className="text-sm text-text-secondary">
            {row.original.file ? formatBytes(row.original.file.byteSize) : '—'}
          </span>
        ),
      },
      {
        id: 'created',
        accessorFn: (row) => row.createdAt,
        header: t('knowledge.columns.created'),
        meta: {
          widthClassName: 'w-32',
          renderSkeleton: () => (
            <div className="h-4 w-20 animate-pulse rounded bg-surface-hover" />
          ),
        },
        cell: ({ row }) => (
          <span className="text-sm text-text-secondary">
            {formatCreated(row.original.createdAt)}
          </span>
        ),
      },
    ];

    if (!canDelete) {
      return cols;
    }

    cols.push({
      id: 'actions',
      header: '',
      enableSorting: false,
      meta: {
        widthClassName: 'w-16',
        align: 'right',
        renderSkeleton: () => (
          <div className="ms-auto h-8 w-8 animate-pulse rounded-lg bg-surface-hover" />
        ),
      },
      cell: ({ row }) => {
        const source = row.original;
        return (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() =>
                openConfirm({
                  title: t('knowledge.delete.title'),
                  text: t('knowledge.delete.text', { name: source.title }),
                  confirmText: t('knowledge.delete.confirm'),
                  confirmVariant: 'danger',
                  onConfirm: () => {
                    void deleteKnowledge.mutateAsync(source.id);
                  },
                })
              }
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-danger-surface hover:text-danger"
              aria-label={t('knowledge.delete.confirm')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    });

    return cols;
  }, [canDelete, deleteKnowledge, i18n.language, openConfirm, t]);

  return (
    <DataTable
      columns={columns}
      data={sources}
      isLoading={knowledgeQuery.isLoading}
      isError={knowledgeQuery.isError}
      onRetry={() => void knowledgeQuery.refetch()}
      getRowId={(source) => source.id}
      manualPagination
      pagination={pagination}
      onPaginationChange={setPagination}
      pageCount={knowledgeQuery.data?.pageCount ?? 0}
      rowCount={knowledgeQuery.data?.total ?? 0}
      emptyState={
        <EmptyState
          icon={BookOpen}
          title={t('projectPages.sections.knowledge.emptyTitle')}
          description={t('projectPages.sections.knowledge.emptyDescription')}
        />
      }
      renderMobileCard={(source) => {
        const Icon = TYPE_ICONS[source.type] ?? FileText;
        const subtitle =
          source.file?.originalFilename ??
          source.url ??
          t(`knowledge.types.${source.type}`);
        const formatCreated = (value: string) =>
          new Date(value).toLocaleDateString(i18n.language, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

        const actions = canDelete ? (
          <button
            type="button"
            onClick={() =>
              openConfirm({
                title: t('knowledge.delete.title'),
                text: t('knowledge.delete.text', { name: source.title }),
                confirmText: t('knowledge.delete.confirm'),
                confirmVariant: 'danger',
                onConfirm: () => {
                  void deleteKnowledge.mutateAsync(source.id);
                },
              })
            }
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-danger-surface hover:text-danger"
            aria-label={t('knowledge.delete.confirm')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : undefined;

        return (
          <MobileDataCard
            actions={actions}
            footer={
              <>
                <MobileDataRow
                  label={t('knowledge.columns.status')}
                  value={
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[source.status]}`}
                    >
                      {t(`knowledge.status.${source.status}`)}
                    </span>
                  }
                />
                <MobileDataRow
                  label={t('knowledge.columns.size')}
                  value={
                    source.file ? formatBytes(source.file.byteSize) : '—'
                  }
                />
                <MobileDataRow
                  label={t('knowledge.columns.created')}
                  value={formatCreated(source.createdAt)}
                />
              </>
            }
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-text-secondary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-text-primary">
                  {source.title}
                </p>
                <p className="truncate text-xs text-text-secondary">{subtitle}</p>
              </div>
            </div>
          </MobileDataCard>
        );
      }}
    />
  );
}
