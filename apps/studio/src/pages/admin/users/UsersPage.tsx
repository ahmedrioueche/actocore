import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/layout/PageHeader';
import Error from '@/components/ui/Error';
import InputField from '@/components/ui/InputField';
import { useAdminListState } from '@/hooks/use-admin-list-state';
import { usePlatformUsers } from '@/hooks/use-platform-data';

import { UsersTable } from './UsersTable';

export default function UsersPage() {
  const { t } = useTranslation();
  const { page, setPage, searchInput, setSearchInput, search, applySearch } =
    useAdminListState();
  const usersQuery = usePlatformUsers(search, page);
  const users = usersQuery.data?.items ?? [];

  return (
    <>
      <PageHeader title={t('admin.users.title')} subtitle={t('admin.users.subtitle')} />
      <form
        className="mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          applySearch();
        }}
      >
        <InputField
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t('admin.users.searchPlaceholder')}
        />
      </form>
      {usersQuery.isError ? (
        <Error onRetry={() => void usersQuery.refetch()} />
      ) : (
        <UsersTable
          users={users}
          isLoading={usersQuery.isLoading}
          meta={usersQuery.data}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
