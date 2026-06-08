import type { PlatformUsageOverviewData } from '@ahmedrioueche/actocore-shared';
import {
  AlertTriangle,
  ArrowDownUp,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { formatCompactNumber } from '@/components/admin/analytics/format-analytics';
import type { DistributionSegment } from '@/components/admin/analytics/DistributionBar';
import type { MetricTone } from '@/components/admin/analytics/MetricCard';

export interface UsageMetricDefinition {
  key: string;
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone: MetricTone;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'bg-primary',
  anthropic: 'bg-secondary',
  google: 'bg-warning',
  stub: 'bg-text-secondary/50',
  unknown: 'bg-surface-secondary',
};

function formatPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value);
}

function providerLabel(provider: string, t: (key: string) => string): string {
  const key = `admin.usage.providers.${provider}`;
  const translated = t(key);
  return translated === key ? provider : translated;
}

export function usePlatformUsageMetrics(
  stats?: PlatformUsageOverviewData,
  isLoading = false,
) {
  const { t, i18n } = useTranslation();

  return useMemo(() => {
    const totalRequests = stats?.totalRequests ?? 0;
    const totalPromptTokens = stats?.totalPromptTokens ?? 0;
    const totalCompletionTokens = stats?.totalCompletionTokens ?? 0;
    const errorRate = stats?.errorRate ?? 0;
    const configuredProvider = stats?.configuredProvider ?? 'stub';
    const byProvider = stats?.byProvider ?? {};
    const byModel = stats?.byModel ?? {};

    const metrics: UsageMetricDefinition[] = [
      {
        key: 'requests',
        label: t('admin.usage.metrics.requests'),
        value: formatCompactNumber(totalRequests, i18n.language),
        hint: t('admin.usage.metrics.requestsHint'),
        icon: MessageSquare,
        tone: 'primary',
      },
      {
        key: 'promptTokens',
        label: t('admin.usage.metrics.promptTokens'),
        value: formatCompactNumber(totalPromptTokens, i18n.language),
        hint: t('admin.usage.metrics.promptTokensHint'),
        icon: ArrowDownUp,
        tone: 'info',
      },
      {
        key: 'completionTokens',
        label: t('admin.usage.metrics.completionTokens'),
        value: formatCompactNumber(totalCompletionTokens, i18n.language),
        hint: t('admin.usage.metrics.completionTokensHint'),
        icon: ArrowDownUp,
        tone: 'accent',
      },
      {
        key: 'errorRate',
        label: t('admin.usage.metrics.errorRate'),
        value: formatPercent(errorRate, i18n.language),
        hint: t('admin.usage.metrics.errorRateHint'),
        icon: AlertTriangle,
        tone: errorRate > 0.05 ? 'warning' : 'success',
      },
    ];

    const providerSegments: DistributionSegment[] = Object.entries(byProvider)
      .map(([provider, row]) => ({
        key: provider,
        label: providerLabel(provider, t),
        value: row.requests,
        colorClass: PROVIDER_COLORS[provider] ?? PROVIDER_COLORS.unknown,
      }))
      .sort((a, b) => b.value - a.value);

    const modelEntries = Object.entries(byModel).sort((a, b) => b[1] - a[1]);
    const topModelCount = modelEntries[0]?.[1] ?? 0;

    return {
      isLoading,
      metrics,
      configuredProvider,
      configuredProviderLabel: providerLabel(configuredProvider, t),
      providerSegments,
      providerTotal: providerSegments.reduce(
        (sum, segment) => sum + segment.value,
        0,
      ),
      modelEntries,
      topModelCount,
      p95LatencyMs: stats?.p95LatencyMs ?? null,
      buckets: stats?.buckets ?? [],
      topAccounts: stats?.topAccounts ?? [],
      topProjects: stats?.topProjects ?? [],
    };
  }, [i18n.language, isLoading, stats, t]);
}
