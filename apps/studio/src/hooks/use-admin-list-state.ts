import { useCallback, useState } from 'react';

export function useAdminListState() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const applySearch = useCallback(() => {
    setSearch(searchInput.trim());
    setPage(1);
  }, [searchInput]);

  return {
    page,
    setPage,
    searchInput,
    setSearchInput,
    search,
    applySearch,
  };
}
