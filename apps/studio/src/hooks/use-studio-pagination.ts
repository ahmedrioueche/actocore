import { useCallback, useState } from 'react';

import {
  defaultListQueryParams,
  type StudioListQueryParams,
} from '@/types/pagination';
import type { PaginationState } from '@/types/table';

/** Local pagination state for lists/tables — pair with `useQuery` + `queryKeys`. */
export function useStudioPagination(
  initial: Partial<StudioListQueryParams> = {},
) {
  const [params, setParams] = useState<StudioListQueryParams>(() => ({
    ...defaultListQueryParams(),
    ...initial,
  }));

  const tablePagination: PaginationState = {
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
  };

  const onPaginationChange = useCallback((next: PaginationState) => {
    setParams((prev) => ({
      ...prev,
      pageIndex: next.pageIndex,
      pageSize: next.pageSize,
    }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setParams((prev) => ({ ...prev, search, pageIndex: 0 }));
  }, []);

  return {
    params,
    setParams,
    tablePagination,
    onPaginationChange,
    setSearch,
  };
}
