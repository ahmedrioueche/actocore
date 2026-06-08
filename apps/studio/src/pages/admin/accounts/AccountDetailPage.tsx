import { useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { PaymentHistoryTable } from '@/components/billing/PaymentHistoryTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { AsyncContent } from '@/components/states';
import { usePlatformAccountSubscription } from '@/hooks/use-platform-data';

export default function AccountDetailPage() {
  const { t } = useTranslation();
  const { accountId } = useParams({ strict: false }) as { accountId: string };
  const detailQuery = usePlatformAccountSubscription(accountId);
  const subscription = detailQuery.data?.subscription;

  return (
    <>
      <PageHeader
        title={t('admin.accountDetail.title')}
        subtitle={
          detailQuery.isLoading
            ? undefined
            : (subscription?.planId ?? t('admin.accountDetail.noSubscription'))
        }
      />
      <AsyncContent
        isLoading={detailQuery.isLoading}
        isError={detailQuery.isError}
        onRetry={() => void detailQuery.refetch()}
        loadingVariant="panels"
      >
        {subscription ? (
          <div className="mb-6 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <p className="text-sm text-text-secondary">{t('admin.accountDetail.status')}</p>
            <p className="mt-1 text-lg font-semibold text-text-primary">{subscription.status}</p>
            <p className="mt-4 text-sm text-text-secondary">{t('admin.accountDetail.provider')}</p>
            <p className="mt-1 text-text-primary">{subscription.provider}</p>
          </div>
        ) : (
          <p className="mb-6 text-sm text-text-secondary">
            {t('admin.accountDetail.noSubscription')}
          </p>
        )}
        <section className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-primary">
            {t('admin.accountDetail.payments')}
          </h3>
          <PaymentHistoryTable
            items={detailQuery.data?.payments ?? []}
            isLoading={false}
          />
        </section>
      </AsyncContent>
    </>
  );
}
