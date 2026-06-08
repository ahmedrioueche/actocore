import type { PlatformAnalyticsOverview } from '@ahmedrioueche/actocore-shared';
import {
  Building2,
  CreditCard,
  FolderKanban,
  MessageSquare,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  formatCompactNumber,
  formatCurrency,
} from '@/components/admin/analytics/format-analytics';
import type { MetricTone } from '@/components/admin/analytics/MetricCard';

export interface PlatformMetricDefinition {
  key: string;
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone: MetricTone;
}

export function usePlatformAnalyticsMetrics(
  stats?: PlatformAnalyticsOverview,
  isLoading = false,
) {
  const { t, i18n } = useTranslation();

  return useMemo(() => {
    const totalAccounts = stats?.totalAccounts ?? 0;
    const activeSubscriptions = stats?.activeSubscriptions ?? 0;
    const trialingSubscriptions = stats?.trialingSubscriptions ?? 0;
    const totalProjects = stats?.totalProjects ?? 0;
    const estimatedMrr = stats?.estimatedMrr ?? 0;
    const monthlyChatRequests = stats?.monthlyChatRequests ?? 0;
    const totalSubscriptions = activeSubscriptions + trialingSubscriptions;
    const projectsPerAccount =
      totalAccounts > 0 ? totalProjects / totalAccounts : 0;

    const dashboardMetrics: PlatformMetricDefinition[] = [
      {
        key: 'accounts',
        label: t('admin.dashboard.accounts'),
        value: formatCompactNumber(totalAccounts, i18n.language),
        icon: Building2,
        tone: 'primary',
      },
      {
        key: 'activeSubs',
        label: t('admin.dashboard.activeSubs'),
        value: formatCompactNumber(activeSubscriptions, i18n.language),
        icon: CreditCard,
        tone: 'success',
      },
      {
        key: 'trialingSubs',
        label: t('admin.dashboard.trialingSubs'),
        value: formatCompactNumber(trialingSubscriptions, i18n.language),
        icon: Sparkles,
        tone: 'warning',
      },
      {
        key: 'projects',
        label: t('admin.dashboard.projects'),
        value: formatCompactNumber(totalProjects, i18n.language),
        icon: FolderKanban,
        tone: 'info',
      },
      {
        key: 'mrr',
        label: t('admin.dashboard.mrr'),
        value: formatCurrency(estimatedMrr, i18n.language),
        icon: CreditCard,
        tone: 'accent',
      },
      {
        key: 'monthlyChat',
        label: t('admin.dashboard.monthlyChat'),
        value: formatCompactNumber(monthlyChatRequests, i18n.language),
        icon: MessageSquare,
        tone: 'neutral',
      },
    ];

    const analyticsMetrics: PlatformMetricDefinition[] = [
      {
        key: 'accounts',
        label: t('admin.analytics.accounts'),
        value: formatCompactNumber(totalAccounts, i18n.language),
        hint: t('admin.analytics.hints.accounts'),
        icon: Building2,
        tone: 'primary',
      },
      {
        key: 'activeSubs',
        label: t('admin.analytics.activeSubs'),
        value: formatCompactNumber(activeSubscriptions, i18n.language),
        hint: t('admin.analytics.hints.activeSubs'),
        icon: CreditCard,
        tone: 'success',
      },
      {
        key: 'mrr',
        label: t('admin.analytics.estimatedMrr'),
        value: formatCurrency(estimatedMrr, i18n.language),
        hint: t('admin.analytics.hints.mrr'),
        icon: CreditCard,
        tone: 'accent',
      },
      {
        key: 'monthlyChat',
        label: t('admin.analytics.monthlyChat'),
        value: formatCompactNumber(monthlyChatRequests, i18n.language),
        hint: t('admin.analytics.hints.monthlyChat'),
        icon: MessageSquare,
        tone: 'info',
      },
    ];

    return {
      isLoading,
      dashboardMetrics,
      analyticsMetrics,
      subscriptionSegments: [
        {
          key: 'active',
          label: t('admin.analytics.subscriptionMix.active'),
          value: activeSubscriptions,
          colorClass: 'bg-success',
        },
        {
          key: 'trialing',
          label: t('admin.analytics.subscriptionMix.trialing'),
          value: trialingSubscriptions,
          colorClass: 'bg-warning',
        },
      ],
      totalSubscriptions,
      totalAccounts,
      totalProjects,
      monthlyChatRequests,
      estimatedMrr,
      activeSubscriptions,
      projectsPerAccount,
    };
  }, [i18n.language, isLoading, stats, t]);
}
