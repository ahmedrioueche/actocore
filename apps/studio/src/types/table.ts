import type {
  ColumnDef,
  PaginationState,
  SortingState,
  TableOptions,
} from '@tanstack/react-table';

/** Re-export TanStack table primitives for Studio components only. */
export type { ColumnDef, PaginationState, SortingState, TableOptions };

/** Default table pagination synced with {@link StudioListQueryParams}. */
export const defaultTablePagination = (): PaginationState => ({
  pageIndex: 0,
  pageSize: 20,
});
