import { Link } from '@tanstack/react-router';
import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  UsageMeter,
  UsageMeterSkeleton,
} from '@/components/billing/UsageMeter';
import { PaymentHistoryTable } from '@/components/billing/PaymentHistoryTable';
import { PageHeader } from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Error from '@/components/ui/Error';
import {
  useBillingQuota,
  usePayPalManageUrl,
  usePaymentHistory,
} from '@/hooks/use-billing';
import { useSubscriptionSummary } from '@/hooks/use-subscription';

export default function BillingPage() {
  const { t } = useTranslation();
  const summaryQuery = useSubscriptionSummary();
  const quotaQuery = useBillingQuota();
  const historyQuery = usePaymentHistory({ page: 1, limit: 20 });
  const manageUrlQuery = usePayPalManageUrl();

  const isLoading = summaryQuery.isLoading || quotaQuery.isLoading;
  const isError = summaryQuery.isError || quotaQuery.isError;

  const summary = summaryQuery.data;
  const usage = summary?.usage;
  const limits = summary?.limits ?? {};

  return (
    <>
      <PageHeader
        title={t('billing.title')}
        subtitle={t('billing.subtitle')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/subscription"
              search={{ subscriptionId: undefined }}
              className="text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              {t('billing.manageSubscription')}
            </Link>
            {manageUrlQuery.data?.manageUrl ? (
              <Button
                variant="outline"
                icon={<ExternalLink className="h-4 w-4" />}
                onClick={() => {
                  window.open(manageUrlQuery.data!.manageUrl, '_blank', 'noopener');
                }}
              >
                {t('billing.manageBilling')}
              </Button>
            ) : null}
          </div>
        }
      />

      {isError ? (
        <Error
          onRetry={() => {
            void summaryQuery.refetch();
            void quotaQuery.refetch();
            void historyQuery.refetch();
          }}
        />
      ) : (
        <div className="space-y-8">
          <section className="space-y-5 rounded-2xl bg-surface p-6 shadow-sm md:p-8">
            <h3 className="text-lg font-semibold text-text-primary">
              {t('billing.usageTitle')}
            </h3>

            {isLoading ? (
              <>
                <UsageMeterSkeleton label={t('billing.projects')} />
                <UsageMeterSkeleton label={t('billing.teamSeats')} />
                <UsageMeterSkeleton label={t('billing.monthlyChat')} />
              </>
            ) : (
              <>
                <UsageMeter
                  label={t('billing.projects')}
                  used={usage?.projectsUsed ?? 0}
                  limit={limits.maxProjects}
                />
                <UsageMeter
                  label={t('billing.teamSeats')}
                  used={usage?.teamSeatsUsed ?? 0}
                  limit={limits.maxTeamSeats}
                />
                <UsageMeter
                  label={t('billing.monthlyChat')}
                  used={
                    quotaQuery.data?.monthlyChatUsed ??
                    usage?.monthlyChatUsed ??
                    0
                  }
                  limit={
                    quotaQuery.data?.monthlyChatLimit ??
                    limits.monthlyChatQuota ??
                    null
                  }
                />
              </>
            )}
          </section>

          <section className="space-y-4 rounded-2xl bg-surface p-6 shadow-sm md:p-8">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                {t('billing.history.title')}
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                {t('billing.history.subtitle')}
              </p>
            </div>

            <PaymentHistoryTable
              items={historyQuery.data?.items ?? []}
              isLoading={historyQuery.isLoading}
            />
          </section>
        </div>
      )}
    </>
  );
}
