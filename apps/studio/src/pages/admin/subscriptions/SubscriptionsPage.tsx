import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/layout/PageHeader';
import Error from '@/components/ui/Error';
import InputField from '@/components/ui/InputField';
import { useAdminListState } from '@/hooks/use-admin-list-state';
import { usePlatformSubscriptions } from '@/hooks/use-platform-data';

import { SubscriptionsTable } from './SubscriptionsTable';

export default function SubscriptionsPage() {
  const { t } = useTranslation();
  const { page, setPage, searchInput, setSearchInput, search, applySearch } =
    useAdminListState();
  const subsQuery = usePlatformSubscriptions(search, page);
  const subscriptions = subsQuery.data?.items ?? [];

  return (
    <>
      <PageHeader
        title={t('admin.subscriptions.title')}
        subtitle={t('admin.subscriptions.subtitle')}
      />
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
          placeholder={t('admin.subscriptions.searchPlaceholder')}
        />
      </form>
      {subsQuery.isError ? (
        <Error onRetry={() => void subsQuery.refetch()} />
      ) : (
        <SubscriptionsTable
          subscriptions={subscriptions}
          isLoading={subsQuery.isLoading}
          meta={subsQuery.data}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
