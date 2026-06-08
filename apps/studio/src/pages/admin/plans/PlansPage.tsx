import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Error from '@/components/ui/Error';
import { usePlatformPlans } from '@/hooks/use-platform-data';
import { useModalStore } from '@/stores/modal';

import { PlansTable } from './PlansTable';

export default function PlansPage() {
  const { t } = useTranslation();
  const openModal = useModalStore((state) => state.openModal);
  const [page, setPage] = useState(1);
  const plansQuery = usePlatformPlans(true, page);
  const plans = plansQuery.data?.items ?? [];

  return (
    <>
      <PageHeader
        title={t('admin.plans.title')}
        subtitle={t('admin.plans.subtitle')}
        actions={
          <Button
            type="button"
            onClick={() => openModal('createPlan', {})}
          >
            {t('admin.plans.create')}
          </Button>
        }
      />

      {plansQuery.isError ? (
        <Error onRetry={() => void plansQuery.refetch()} />
      ) : (
        <PlansTable
          plans={plans}
          isLoading={plansQuery.isLoading}
          meta={plansQuery.data}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
