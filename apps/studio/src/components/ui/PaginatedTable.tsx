import type { PaginationMeta } from '@ahmedrioueche/actocore-shared';
import type { ReactNode } from 'react';

import Pagination from '@/components/ui/Pagination';
import { Table, type TableColumn } from '@/components/ui/Table';

type PaginatedTableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  meta?: Pick<PaginationMeta, 'page' | 'pageCount' | 'total' | 'limit'>;
  onPageChange: (page: number) => void;
  emptyState?: ReactNode;
  skeletonRowCount?: number;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
  renderMobileCard?: (item: T, index: number) => ReactNode;
  className?: string;
};

export function PaginatedTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  meta,
  onPageChange,
  emptyState,
  skeletonRowCount = 5,
  onRowClick,
  rowClassName,
  renderMobileCard,
  className,
}: PaginatedTableProps<T>) {
  const startIndex = meta ? (meta.page - 1) * meta.limit : 0;
  const endIndex = meta ? Math.min(meta.page * meta.limit, meta.total) : data.length;

  return (
    <div className={className}>
      <Table
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        isLoading={isLoading}
        skeletonRowCount={skeletonRowCount}
        emptyState={emptyState}
        onRowClick={onRowClick}
        rowClassName={rowClassName}
        renderMobileCard={renderMobileCard}
      />
      {meta && meta.pageCount > 1 ? (
        <Pagination
          currentPage={meta.page}
          totalPages={meta.pageCount}
          totalRecords={meta.total}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={onPageChange}
        />
      ) : null}
    </div>
  );
}
