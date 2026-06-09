import { useNavigate } from '@tanstack/react-router';
import { CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ActivityMeter } from '@/components/admin/analytics/ActivityMeter';
import { AnalyticsPanel } from '@/components/admin/analytics/AnalyticsPanel';
import { formatCompactNumber } from '@/components/admin/analytics/format-analytics';
import {
  UsageMeter,
  UsageMeterSkeleton,
} from '@/components/billing/UsageMeter';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  UsageDateRangeSelect,
  UsageMetricGrid,
  UsageProjectsRollupTable,
  useUsageSummaryMetrics,
} from '@/components/usage';
import Button from '@/components/ui/Button';
import Error from '@/components/ui/Error';
import NoData from '@/components/ui/NoData';
import { useBillingQuota } from '@/hooks/use-billing';
import { useWorkspaceUsageSummary } from '@/hooks/use-usage-data';
import { useUsageDateRange } from '@/hooks/use-usage-date-range';
import { formatTokenCount } from '@/utils/format-token-count';

export default function WorkspaceUsagePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { preset, setPreset, from, to } = useUsageDateRange('30d');
  const summaryQuery = useWorkspaceUsageSummary(from, to);
  const quotaQuery = useBillingQuota();

  const isLoading = summaryQuery.isLoading || quotaQuery.isLoading;
  const isError = summaryQuery.isError || quotaQuery.isError;

  const workspaceSummary = summaryQuery.data;
  const metrics = useUsageSummaryMetrics(
    workspaceSummary
      ? {
          projectId: '',
          totalRequests: workspaceSummary.totalRequests,
          totalPromptTokens: workspaceSummary.totalPromptTokens,
          totalCompletionTokens: workspaceSummary.totalCompletionTokens,
          byIntent: workspaceSummary.byIntent,
          from: workspaceSummary.from,
          to: workspaceSummary.to,
        }
      : undefined,
    undefined,
    isLoading,
  );

  const intentEntries = Object.entries(workspaceSummary?.byIntent ?? {}).sort(
    (a, b) => b[1] - a[1],
  );
  const topIntentCount = intentEntries[0]?.[1] ?? 0;
  const monthlyTokensUsed = quotaQuery.data?.monthlyTokensUsed ?? 0;
  const monthlyTokenLimit = quotaQuery.data?.monthlyTokenLimit ?? null;

  return (
    <>
      <PageHeader
        title={t('usage.title')}
        subtitle={t('usage.subtitle')}
        actions={
          <Button
            variant="outline"
            icon={<CreditCard className="h-4 w-4" />}
            onClick={() => navigate({ to: '/billing' })}
          >
            {t('usage.manageBilling')}
          </Button>
        }
      />

      <div className="mb-6">
        <UsageDateRangeSelect value={preset} onChange={setPreset} />
      </div>

      {isError ? (
        <Error
          onRetry={() => {
            void summaryQuery.refetch();
            void quotaQuery.refetch();
          }}
        />
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-text-primary">
              {t('usage.quota.title')}
            </h2>
            {isLoading ? (
              <UsageMeterSkeleton label={t('usage.quota.monthlyTokens')} />
            ) : (
              <UsageMeter
                label={t('usage.quota.monthlyTokens')}
                used={monthlyTokensUsed}
                limit={monthlyTokenLimit}
                formatValue={formatTokenCount}
              />
            )}
          </div>

          <UsageMetricGrid
            metrics={metrics.metrics.filter((m) => m.key !== 'errorRate')}
            isLoading={isLoading}
          />

          <AnalyticsPanel
            title={t('usage.intentBreakdown.title')}
            description={t('usage.intentBreakdown.workspaceDescription')}
          >
            {intentEntries.length === 0 && !isLoading ? (
              <NoData title={t('usage.intentBreakdown.empty')} />
            ) : (
              <div className="space-y-4">
                {intentEntries.slice(0, 8).map(([intent, count]) => (
                  <ActivityMeter
                    key={intent}
                    label={intent}
                    value={count}
                    max={Math.max(topIntentCount, 1)}
                    formatValue={(value) =>
                      formatCompactNumber(value, i18n.language)
                    }
                    isLoading={isLoading}
                  />
                ))}
              </div>
            )}
          </AnalyticsPanel>

          <UsageProjectsRollupTable
            projects={workspaceSummary?.projects ?? []}
            isLoading={isLoading}
          />
        </div>
      )}
    </>
  );
}
