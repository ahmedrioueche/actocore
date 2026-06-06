import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/layout/PageHeader';
import Error from '@/components/ui/Error';
import { Skeleton } from '@/components/ui/Skeleton';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  useBillingQuota,
  useBillingSubscription,
} from '@/hooks/use-billing';
import { cn } from '@/utils/helper';

function UsageMeter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit?: number | null;
}) {
  const { t } = useTranslation();
  const hasLimit = limit != null && limit > 0;
  const percent = hasLimit ? Math.min(100, (used / limit) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-text-primary">{label}</span>
        <span className="text-text-secondary">
          {hasLimit
            ? t('billing.usageValue', { used, limit })
            : t('billing.usageUnlimited', { used })}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
        <div
          className={cn(
            'h-full rounded-full bg-brand-gradient transition-all duration-500',
            percent >= 90 && 'from-danger to-danger-hover',
          )}
          style={{ width: hasLimit ? `${percent}%` : '0%' }}
        />
      </div>
    </div>
  );
}

function UsageMeterSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-text-primary">{label}</span>
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

export default function BillingPage() {
  const { t } = useTranslation();
  const subscriptionQuery = useBillingSubscription();
  const quotaQuery = useBillingQuota();

  const isLoading = subscriptionQuery.isLoading || quotaQuery.isLoading;
  const isError = subscriptionQuery.isError || quotaQuery.isError;

  const summary = subscriptionQuery.data;
  const subscription = summary?.subscription;
  const planName =
    subscription?.plan?.name ??
    subscription?.planId ??
    t('billing.freePlan');
  const status = subscription?.status ?? 'active';
  const usage = summary?.usage;
  const limits = summary?.limits ?? {};

  return (
    <>
      <PageHeader title={t('billing.title')} subtitle={t('billing.subtitle')} />

      {isError ? (
        <Error
          onRetry={() => {
            void subscriptionQuery.refetch();
            void quotaQuery.refetch();
          }}
        />
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl bg-gradient-to-br from-primary/[0.08] via-surface to-secondary/[0.06] p-6 shadow-sm md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">
                  {t('billing.currentPlan')}
                </p>
                {isLoading ? (
                  <Skeleton className="mt-2 h-8 w-48 max-w-full" />
                ) : (
                  <h2 className="mt-1 text-2xl font-bold text-text-primary">
                    {planName}
                  </h2>
                )}
                {!isLoading &&
                summary?.trial?.isTrialing &&
                summary.trial.trialEndsAt ? (
                  <p className="mt-2 text-sm text-text-secondary">
                    {t('billing.trialEnds', {
                      date: new Date(summary.trial.trialEndsAt).toLocaleDateString(),
                    })}
                  </p>
                ) : isLoading ? (
                  <Skeleton className="mt-2 h-4 w-56 max-w-full" />
                ) : null}
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-20 rounded-full" />
              ) : (
                <StatusBadge status={status} />
              )}
            </div>
          </section>

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
        </div>
      )}
    </>
  );
}
