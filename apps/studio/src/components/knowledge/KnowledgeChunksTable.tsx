import type { KnowledgeChunkData } from '@ahmedrioueche/actocore-shared';
import { useMemo, useState } from 'react';
import type { PaginationState } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

import { DataTable } from '@/components/ui/DataTable';
import { useKnowledgeChunks } from '@/hooks/use-knowledge';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import type { ColumnDef } from '@/types/table';

interface KnowledgeChunksTableProps {
  projectId: string;
  sourceId: string;
}

function formatMetadata(
  chunk: KnowledgeChunkData,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const parts: string[] = [];
  if (chunk.kind === 'parent') {
    parts.push(t('knowledge.detail.kindParent'));
  }
  if (chunk.metadata?.page) {
    parts.push(t('knowledge.detail.pdfPage', { page: chunk.metadata.page }));
  }
  if (chunk.metadata?.pageUrl) {
    parts.push(chunk.metadata.pageUrl);
  }
  if (chunk.metadata?.headingPath?.length) {
    parts.push(chunk.metadata.headingPath.join(' › '));
  }
  return parts.length > 0 ? parts.join(' · ') : '—';
}

export function KnowledgeChunksTable({
  projectId,
  sourceId,
}: KnowledgeChunksTableProps) {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const chunksQuery = useKnowledgeChunks(projectId, sourceId, {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const chunks = chunksQuery.data?.items ?? [];

  const columns = useMemo<ColumnDef<KnowledgeChunkData>[]>(
    () => [
      {
        id: 'chunkIndex',
        accessorFn: (row) => row.chunkIndex,
        header: t('knowledge.detail.chunkColumn'),
        meta: { widthClassName: 'w-24' },
        cell: ({ row }) => (
          <span className="font-mono text-sm text-text-secondary">
            {row.original.chunkIndex}
          </span>
        ),
      },
      {
        id: 'metadata',
        accessorFn: (row) => row.metadata?.headingPath?.join(' ') ?? '',
        header: t('knowledge.detail.metaColumn'),
        meta: { widthClassName: 'w-48' },
        cell: ({ row }) => (
          <span className="text-xs text-text-secondary">
            {formatMetadata(row.original, t)}
          </span>
        ),
      },
      {
        id: 'content',
        accessorFn: (row) => row.content,
        header: t('knowledge.detail.contentColumn'),
        cell: ({ row }) => (
          <p className="whitespace-pre-wrap text-sm text-text-primary">
            {row.original.content}
          </p>
        ),
      },
    ],
    [t],
  );

  return (
    <DataTable
      columns={columns}
      data={chunks}
      isLoading={chunksQuery.isLoading}
      isError={chunksQuery.isError}
      onRetry={() => void chunksQuery.refetch()}
      getRowId={(chunk) => chunk.id}
      manualPagination
      pagination={pagination}
      onPaginationChange={setPagination}
      pageCount={chunksQuery.data?.pageCount ?? 0}
      rowCount={chunksQuery.data?.total ?? 0}
      emptyState={
        <p className="py-8 text-center text-sm text-text-secondary">
          {t('knowledge.detail.noChunks')}
        </p>
      }
    />
  );
}
