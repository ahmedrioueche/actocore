import type { PlatformAnalyticsOverview } from '@ahmedrioueche/actocore-shared';
import { useTranslation } from 'react-i18next';

import { ActivityMeter } from '@/components/admin/analytics/ActivityMeter';
import { AnalyticsPanel } from '@/components/admin/analytics/AnalyticsPanel';
import { DistributionBar } from '@/components/admin/analytics/DistributionBar';
import { formatCompactNumber } from '@/components/admin/analytics/format-analytics';
import { MetricCard } from '@/components/admin/analytics/MetricCard';
import { RevenueHeroCard } from '@/components/admin/analytics/RevenueHeroCard';
import { usePlatformAnalyticsMetrics } from '@/components/admin/analytics/use-platform-analytics-metrics';
import Error from '@/components/ui/Error';
import { cn } from '@/utils/helper';

interface PlatformAnalyticsViewProps {
  variant: 'dashboard' | 'analytics';
  stats?: PlatformAnalyticsOverview;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function PlatformAnalyticsView({
  variant,
  stats,
  isLoading = false,
  isError = false,
  onRetry,
}: PlatformAnalyticsViewProps) {
  const { t, i18n } = useTranslation();
  const metrics = usePlatformAnalyticsMetrics(stats, isLoading);
  const cards =
    variant === 'dashboard' ? metrics.dashboardMetrics : metrics.analyticsMetrics;

  if (isError) {
    return <Error onRetry={onRetry} />;
  }

  return (
    <div className="space-y-6">
      {variant === 'analytics' ? (
        <RevenueHeroCard
          estimatedMrr={metrics.estimatedMrr}
          activeSubscriptions={metrics.activeSubscriptions}
          isLoading={isLoading}
        />
      ) : null}

      <div
        className={cn(
          'grid gap-4',
          variant === 'dashboard'
            ? 'sm:grid-cols-2 xl:grid-cols-3'
            : 'md:grid-cols-2',
        )}
      >
        {cards.map((metric) => (
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

      <div
        className={cn(
          'grid gap-6',
          variant === 'dashboard' ? 'xl:grid-cols-2' : 'lg:grid-cols-2',
        )}
      >
        <AnalyticsPanel
          title={t('admin.analytics.subscriptionMix.title')}
          description={t('admin.analytics.subscriptionMix.description')}
        >
          <DistributionBar
            segments={metrics.subscriptionSegments}
            total={metrics.totalSubscriptions}
            isLoading={isLoading}
          />
        </AnalyticsPanel>

        <AnalyticsPanel
          title={t('admin.analytics.platformScale.title')}
          description={t('admin.analytics.platformScale.description')}
        >
          <div className="space-y-5">
            <ActivityMeter
              label={t('admin.analytics.platformScale.projects')}
              value={metrics.totalProjects}
              max={Math.max(metrics.totalProjects, metrics.totalAccounts, 1)}
              formatValue={(value) => formatCompactNumber(value, i18n.language)}
              isLoading={isLoading}
              toneClassName="bg-brand-gradient"
            />
            <ActivityMeter
              label={t('admin.analytics.platformScale.chatVolume')}
              value={metrics.monthlyChatRequests}
              max={Math.max(metrics.monthlyChatRequests, 1)}
              formatValue={(value) => formatCompactNumber(value, i18n.language)}
              isLoading={isLoading}
              toneClassName="bg-gradient-to-r from-secondary to-primary"
            />
            {!isLoading ? (
              <p className="rounded-xl bg-surface-secondary/80 px-4 py-3 text-sm text-text-secondary">
                {t('admin.analytics.platformScale.ratioHint', {
                  ratio: metrics.projectsPerAccount.toFixed(1),
                })}
              </p>
            ) : null}
          </div>
        </AnalyticsPanel>
      </div>
    </div>
  );
}
