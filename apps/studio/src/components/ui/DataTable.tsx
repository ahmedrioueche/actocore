import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type Updater,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { ErrorState } from '@/components/states';
import Pagination from '@/components/ui/Pagination';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  /** Inline loading skeleton rows are shown while true. */
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  /** Rendered when there is no data (and not loading / error). */
  emptyState?: ReactNode;

  // Pagination
  enablePagination?: boolean;
  pageSize?: number;
  /** Enable server-driven pagination — supply `pagination`, `onPaginationChange`, `pageCount`, `rowCount`. */
  manualPagination?: boolean;
  pageCount?: number;
  rowCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: (next: PaginationState) => void;

  // Sorting (client-side only)
  enableSorting?: boolean;

  // Rendering
  renderMobileCard?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  skeletonRowCount?: number;
  getRowId?: (row: T) => string;
}

const alignClass = (align?: 'left' | 'center' | 'right') =>
  align === 'right'
    ? 'text-end'
    : align === 'center'
      ? 'text-center'
      : 'text-start';

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  emptyState,
  enablePagination = true,
  pageSize = DEFAULT_PAGE_SIZE,
  manualPagination = false,
  pageCount,
  rowCount,
  pagination,
  onPaginationChange,
  enableSorting = true,
  renderMobileCard,
  onRowClick,
  skeletonRowCount = 5,
  getRowId,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [internalPagination, setInternalPagination] = useState<PaginationState>(
    { pageIndex: 0, pageSize },
  );

  const paginationState = manualPagination
    ? (pagination ?? { pageIndex: 0, pageSize })
    : internalPagination;

  const handlePaginationChange = (updater: Updater<PaginationState>) => {
    const next =
      typeof updater === 'function' ? updater(paginationState) : updater;
    if (manualPagination) {
      onPaginationChange?.(next);
    } else {
      setInternalPagination(next);
    }
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: enableSorting ? sorting : undefined,
      pagination: enablePagination ? paginationState : undefined,
    },
    onSortingChange: enableSorting ? setSorting : undefined,
    onPaginationChange: enablePagination ? handlePaginationChange : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel:
      enableSorting && !manualPagination ? getSortedRowModel() : undefined,
    getPaginationRowModel:
      enablePagination && !manualPagination
        ? getPaginationRowModel()
        : undefined,
    manualPagination,
    pageCount: manualPagination ? pageCount : undefined,
    getRowId,
  });

  if (isError) {
    return <ErrorState error={errorMessage} onRetry={onRetry} />;
  }

  const totalRecords = manualPagination ? (rowCount ?? 0) : data.length;
  const isEmpty = !isLoading && totalRecords === 0;

  if (isEmpty && emptyState) {
    return <>{emptyState}</>;
  }

  const leafColumns = table.getVisibleLeafColumns();
  const rows = table.getRowModel().rows;

  const renderSkeletonRows = () =>
    Array.from({ length: skeletonRowCount }).map((_, rowIdx) => (
      <tr key={`skeleton-${rowIdx}`} className="animate-pulse">
        {leafColumns.map((column) => (
          <td key={column.id} className="px-6 py-4">
            {column.columnDef.meta?.renderSkeleton ? (
              column.columnDef.meta.renderSkeleton()
            ) : (
              <div className="h-4 w-24 rounded bg-surface-hover" />
            )}
          </td>
        ))}
      </tr>
    ));

  // Footer counts
  const pageIndex = paginationState.pageIndex;
  const currentPageSize = paginationState.pageSize;
  const startIndex = pageIndex * currentPageSize;
  const endIndex = manualPagination
    ? Math.min(startIndex + currentPageSize, totalRecords)
    : startIndex + rows.length;

  return (
    <div className="space-y-0">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {/* Desktop */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead className="border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta;
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className={`px-6 py-4 text-sm font-semibold text-text-primary ${meta?.widthClassName ?? ''} ${alignClass(meta?.align)} ${meta?.headerClassName ?? ''}`}
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1 transition-colors hover:text-primary"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {sorted === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5" />
                            ) : sorted === 'desc' ? (
                              <ArrowDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                            )}
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? renderSkeletonRows()
                : rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                      className={`transition-colors duration-200 ${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta;
                        return (
                          <td
                            key={cell.id}
                            className={`px-6 py-4 ${alignClass(meta?.align)} ${meta?.cellClassName ?? ''}`}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        {renderMobileCard ? (
          <div className="divide-y divide-border md:hidden">
            {isLoading
              ? Array.from({ length: skeletonRowCount }).map((_, i) => (
                  <div key={`m-skeleton-${i}`} className="p-4">
                    <div className="h-12 w-full animate-pulse rounded-lg bg-surface-hover" />
                  </div>
                ))
              : rows.map((row) => (
                  <div
                    key={row.id}
                    onClick={
                      onRowClick ? () => onRowClick(row.original) : undefined
                    }
                    className={onRowClick ? 'cursor-pointer' : ''}
                  >
                    {renderMobileCard(row.original)}
                  </div>
                ))}
          </div>
        ) : null}
      </div>

      {enablePagination ? (
        <Pagination
          currentPage={pageIndex + 1}
          totalPages={table.getPageCount()}
          totalRecords={totalRecords}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={(page) => table.setPageIndex(page - 1)}
        />
      ) : null}
    </div>
  );
}

export default DataTable;
