import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/layout/PageHeader';
import Error from '@/components/ui/Error';
import InputField from '@/components/ui/InputField';
import { useAdminListState } from '@/hooks/use-admin-list-state';
import { usePlatformAccounts } from '@/hooks/use-platform-data';

import { AccountsTable } from './AccountsTable';

export default function AccountsPage() {
  const { t } = useTranslation();
  const { page, setPage, searchInput, setSearchInput, search, applySearch } =
    useAdminListState();
  const accountsQuery = usePlatformAccounts(search, page);
  const accounts = accountsQuery.data?.items ?? [];

  return (
    <>
      <PageHeader title={t('admin.accounts.title')} subtitle={t('admin.accounts.subtitle')} />
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
          placeholder={t('admin.accounts.searchPlaceholder')}
        />
      </form>
      {accountsQuery.isError ? (
        <Error onRetry={() => void accountsQuery.refetch()} />
      ) : (
        <AccountsTable
          accounts={accounts}
          isLoading={accountsQuery.isLoading}
          meta={accountsQuery.data}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
