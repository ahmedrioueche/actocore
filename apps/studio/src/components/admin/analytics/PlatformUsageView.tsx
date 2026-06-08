import type { PlatformUsageOverviewData } from '@ahmedrioueche/actocore-shared';
import { Link } from '@tanstack/react-router';
import { Cpu } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ActivityMeter } from '@/components/admin/analytics/ActivityMeter';
import { AnalyticsPanel } from '@/components/admin/analytics/AnalyticsPanel';
import { DistributionBar } from '@/components/admin/analytics/DistributionBar';
import { formatCompactNumber } from '@/components/admin/analytics/format-analytics';
import { MetricCard } from '@/components/admin/analytics/MetricCard';
import { UsageTimeSeriesChart } from '@/components/admin/analytics/UsageTimeSeriesChart';
import { usePlatformUsageMetrics } from '@/components/admin/analytics/use-platform-usage-metrics';
import Error from '@/components/ui/Error';
import NoData from '@/components/ui/NoData';
import { Table, type TableColumn } from '@/components/ui/Table';

interface PlatformUsageViewProps {
  stats?: PlatformUsageOverviewData;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function PlatformUsageView({
  stats,
  isLoading = false,
  isError = false,
  onRetry,
}: PlatformUsageViewProps) {
  const { t, i18n } = useTranslation();
  const metrics = usePlatformUsageMetrics(stats, isLoading);

  const accountColumns = useMemo(
    () =>
      [
        {
          key: 'name',
          header: t('admin.usage.topAccounts.name'),
          render: (row) => (
            <Link
              to="/admin/accounts/$accountId"
              params={{ accountId: row.accountId }}
              className="font-medium text-primary hover:underline"
            >
              {row.accountName}
            </Link>
          ),
          renderSkeleton: () => (
            <div className="h-4 w-32 animate-pulse rounded bg-surface-hover" />
          ),
        },
        {
          key: 'requests',
          header: t('admin.usage.topAccounts.requests'),
          width: 'w-28',
          align: 'right' as const,
          render: (row) =>
            formatCompactNumber(row.totalRequests, i18n.language),
          renderSkeleton: () => (
            <div className="ms-auto h-4 w-12 animate-pulse rounded bg-surface-hover" />
          ),
        },
        {
          key: 'tokens',
          header: t('admin.usage.topAccounts.tokens'),
          width: 'w-32',
          align: 'right' as const,
          render: (row) =>
            formatCompactNumber(
              row.totalPromptTokens + row.totalCompletionTokens,
              i18n.language,
            ),
          renderSkeleton: () => (
            <div className="ms-auto h-4 w-16 animate-pulse rounded bg-surface-hover" />
          ),
        },
      ] satisfies TableColumn<(typeof metrics.topAccounts)[number]>[],
    [i18n.language, metrics.topAccounts, t],
  );

  const projectColumns = useMemo(
    () =>
      [
        {
          key: 'name',
          header: t('admin.usage.topProjects.name'),
          render: (row) => (
            <span className="font-medium text-text-primary">{row.projectName}</span>
          ),
          renderSkeleton: () => (
            <div className="h-4 w-32 animate-pulse rounded bg-surface-hover" />
          ),
        },
        {
          key: 'account',
          header: t('admin.usage.topProjects.account'),
          render: (row) => (
            <Link
              to="/admin/accounts/$accountId"
              params={{ accountId: row.accountId }}
              className="text-primary hover:underline"
            >
              {row.accountName}
            </Link>
          ),
          renderSkeleton: () => (
            <div className="h-4 w-28 animate-pulse rounded bg-surface-hover" />
          ),
        },
        {
          key: 'requests',
          header: t('admin.usage.topProjects.requests'),
          width: 'w-28',
          align: 'right' as const,
          render: (row) =>
            formatCompactNumber(row.totalRequests, i18n.language),
          renderSkeleton: () => (
            <div className="ms-auto h-4 w-12 animate-pulse rounded bg-surface-hover" />
          ),
        },
        {
          key: 'tokens',
          header: t('admin.usage.topProjects.tokens'),
          width: 'w-32',
          align: 'right' as const,
          render: (row) =>
            formatCompactNumber(
              row.totalPromptTokens + row.totalCompletionTokens,
              i18n.language,
            ),
          renderSkeleton: () => (
            <div className="ms-auto h-4 w-16 animate-pulse rounded bg-surface-hover" />
          ),
        },
      ] satisfies TableColumn<(typeof metrics.topProjects)[number]>[],
    [i18n.language, metrics.topProjects, t],
  );

  if (isError) {
    return <Error onRetry={onRetry} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Cpu className="h-4 w-4" aria-hidden />
          <span>{t('admin.usage.configuredProvider')}</span>
        </div>
        <span className="rounded-full bg-brand-gradient-soft px-3 py-1 text-sm font-semibold text-primary">
          {metrics.configuredProviderLabel}
        </span>
        {!isLoading && metrics.p95LatencyMs != null ? (
          <span className="text-sm text-text-secondary">
            {t('admin.usage.p95Latency', {
              value: formatCompactNumber(metrics.p95LatencyMs, i18n.language),
            })}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.metrics.map((metric) => (
          <MetricCard
            key={metric.key}
            label={metric.label}
            value={metric.value}
            hint={metric.hint}
            icon={metric.icon}
            tone={metric.tone}
            isLoading={isLoading}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsPanel
          title={t('admin.usage.providerMix.title')}
          description={t('admin.usage.providerMix.description')}
        >
          {metrics.providerSegments.length === 0 && !isLoading ? (
            <p className="text-sm text-text-secondary">
              {t('admin.usage.providerMix.empty')}
            </p>
          ) : (
            <DistributionBar
              segments={metrics.providerSegments}
              total={metrics.providerTotal}
              isLoading={isLoading}
            />
          )}
        </AnalyticsPanel>

        <AnalyticsPanel
          title={t('admin.usage.modelBreakdown.title')}
          description={t('admin.usage.modelBreakdown.description')}
        >
          {metrics.modelEntries.length === 0 && !isLoading ? (
            <p className="text-sm text-text-secondary">
              {t('admin.usage.modelBreakdown.empty')}
            </p>
          ) : (
            <div className="space-y-4">
              {metrics.modelEntries.slice(0, 6).map(([model, count]) => (
                <ActivityMeter
                  key={model}
                  label={model}
                  value={count}
                  max={Math.max(metrics.topModelCount, 1)}
                  formatValue={(value) =>
                    formatCompactNumber(value, i18n.language)
                  }
                  isLoading={isLoading}
                  toneClassName="bg-gradient-to-r from-secondary to-primary"
                />
              ))}
            </div>
          )}
        </AnalyticsPanel>
      </div>

      <AnalyticsPanel
        title={t('admin.usage.series.title')}
        description={t('admin.usage.series.description')}
      >
        <UsageTimeSeriesChart
          buckets={metrics.buckets}
          isLoading={isLoading}
        />
      </AnalyticsPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <AnalyticsPanel
          title={t('admin.usage.topAccounts.title')}
          description={t('admin.usage.topAccounts.description')}
        >
          <Table
            columns={accountColumns}
            data={metrics.topAccounts}
            keyExtractor={(row) => row.accountId}
            isLoading={isLoading}
            skeletonRowCount={5}
            emptyState={<NoData title={t('admin.usage.topAccounts.empty')} />}
          />
        </AnalyticsPanel>

        <AnalyticsPanel
          title={t('admin.usage.topProjects.title')}
          description={t('admin.usage.topProjects.description')}
        >
          <Table
            columns={projectColumns}
            data={metrics.topProjects}
            keyExtractor={(row) => row.projectId}
            isLoading={isLoading}
            skeletonRowCount={5}
            emptyState={<NoData title={t('admin.usage.topProjects.empty')} />}
          />
        </AnalyticsPanel>
      </div>
    </div>
  );
}
