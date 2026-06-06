/** Common pagination contract shared by backend, Studio, and SDK. */

/** Query params accepted by paginated list endpoints. */
export interface PaginationQuery {
  /** 1-based page number. */
  page?: number;
  /** Items per page. */
  limit?: number;
}

/** Metadata describing a single page of results. */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

/** Standard envelope returned by every paginated list endpoint. */
export interface Paginated<T> extends PaginationMeta {
  items: T[];
}
