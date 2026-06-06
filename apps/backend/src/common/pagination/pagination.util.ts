import type { Paginated, PaginationQuery } from '@ahmedrioueche/actocore-shared';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export interface NormalizedPagination {
  page: number;
  limit: number;
  skip: number;
}

function toInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : undefined;
}

/** Clamp incoming query params into safe page/limit/skip values. */
export function normalizePagination(
  query: PaginationQuery = {},
): NormalizedPagination {
  const page = Math.max(1, toInt(query.page) ?? DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, toInt(query.limit) ?? DEFAULT_LIMIT),
  );
  return { page, limit, skip: (page - 1) * limit };
}

/** Build the standard paginated envelope from a page of items + total count. */
export function paginate<T>(
  items: T[],
  total: number,
  { page, limit }: { page: number; limit: number },
): Paginated<T> {
  return {
    items,
    total,
    page,
    limit,
    pageCount: total === 0 ? 0 : Math.ceil(total / limit),
  };
}
