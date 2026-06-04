/** Studio-only list UI state — not part of the Core API contract. */

export const DEFAULT_PAGE_SIZE = 20;

export interface StudioListQueryParams {
  pageIndex: number;
  pageSize: number;
  search?: string;
}

export const defaultListQueryParams = (): StudioListQueryParams => ({
  pageIndex: 0,
  pageSize: DEFAULT_PAGE_SIZE,
});

/** Map table/query pagination to skip/limit when an API supports offset paging. */
export function toSkipLimit({ pageIndex, pageSize }: StudioListQueryParams): {
  skip: number;
  limit: number;
} {
  return { skip: pageIndex * pageSize, limit: pageSize };
}
