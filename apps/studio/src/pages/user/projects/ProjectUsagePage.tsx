import { useParams } from '@tanstack/react-router';
import { BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AnalyticsPanel } from '@/components/admin/analytics/AnalyticsPanel';
import { UsageTimeSeriesChart } from '@/components/admin/analytics/UsageTimeSeriesChart';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/states';
import {
  UsageBreakdownPanels,
  UsageDateRangeSelect,
  UsageMetricGrid,
  useUsageSummaryMetrics,
} from '@/components/usage';
import Error from '@/components/ui/Error';
import {
  useProjectUsageBreakdown,
  useProjectUsageSeries,
  useProjectUsageSummary,
} from '@/hooks/use-usage-data';
import { useUsageDateRange } from '@/hooks/use-usage-date-range';
import { useProject } from '@/hooks/use-projects';

export default function ProjectUsagePage() {
  const { t } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const projectQuery = useProject(projectId ?? null);
  const { preset, setPreset, from, to } = useUsageDateRange('30d');

  const summaryQuery = useProjectUsageSummary(projectId, from, to);
  const seriesQuery = useProjectUsageSeries(projectId, from, to);
  const breakdownQuery = useProjectUsageBreakdown(projectId, from, to);

  const isLoading =
    summaryQuery.isLoading || seriesQuery.isLoading || breakdownQuery.isLoading;
  const isError =
    summaryQuery.isError || seriesQuery.isError || breakdownQuery.isError;

  const metrics = useUsageSummaryMetrics(
    summaryQuery.data,
    breakdownQuery.data,
    isLoading,
  );

  const projectName = projectQuery.data?.name;
  const showEmpty =
    !isLoading &&
    !isError &&
    metrics.totalRequests === 0 &&
    (seriesQuery.data?.buckets.length ?? 0) === 0;

  return (
    <>
      <PageHeader
        title={t('projectPages.sections.usage.title')}
        subtitle={
          projectName
            ? t('projectPages.sectionSubtitle', { project: projectName })
            : undefined
        }
      />
      <div className="mb-6">
        <UsageDateRangeSelect value={preset} onChange={setPreset} />
      </div>

      {isError ? (
        <Error
          onRetry={() => {
            void summaryQuery.refetch();
            void seriesQuery.refetch();
            void breakdownQuery.refetch();
          }}
        />
      ) : showEmpty ? (
        <EmptyState
          icon={BarChart3}
          title={t('projectPages.sections.usage.emptyTitle')}
          description={t('projectPages.sections.usage.emptyDescription')}
        />
      ) : (
        <div className="space-y-6">
          <UsageMetricGrid metrics={metrics.metrics} isLoading={isLoading} />

          <AnalyticsPanel
            title={t('usage.series.title')}
            description={t('usage.series.description')}
          >
            <UsageTimeSeriesChart
              buckets={seriesQuery.data?.buckets ?? []}
              isLoading={isLoading}
              emptyLabel={t('usage.series.empty')}
            />
          </AnalyticsPanel>

          <UsageBreakdownPanels
            intentEntries={metrics.intentEntries}
            modelEntries={metrics.modelEntries}
            apiKeyEntries={metrics.apiKeyEntries}
            topIntentCount={metrics.topIntentCount}
            topModelCount={metrics.topModelCount}
            topApiKeyCount={metrics.topApiKeyCount}
            isLoading={isLoading}
          />
        </div>
      )}
    </>
  );
}
