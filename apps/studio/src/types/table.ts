import type {
  ColumnDef,
  PaginationState,
  RowData,
  SortingState,
  TableOptions,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';

/** Re-export TanStack table primitives for Studio components only. */
export type { ColumnDef, PaginationState, SortingState, TableOptions };

/** Default table pagination synced with {@link StudioListQueryParams}. */
export const defaultTablePagination = (): PaginationState => ({
  pageIndex: 0,
  pageSize: 20,
});

declare module '@tanstack/react-table' {
  // TValue is required by the base interface signature; kept for compatibility.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Text alignment for header + cells. */
    align?: 'left' | 'center' | 'right';
    /** Tailwind width class for the column (e.g. `w-32`). */
    widthClassName?: string;
    /** Extra classes for the header cell. */
    headerClassName?: string;
    /** Extra classes for body cells. */
    cellClassName?: string;
    /** Per-column skeleton renderer used while loading. */
    renderSkeleton?: () => ReactNode;
  }
}
