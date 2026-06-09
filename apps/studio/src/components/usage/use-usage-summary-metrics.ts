import type {
  ProjectUsageBreakdownData,
  UsageSummaryData,
} from "@ahmedrioueche/actocore-shared";
import {
  AlertTriangle,
  ArrowDownUp,
  Clock,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { formatCompactNumber } from "@/components/admin/analytics/format-analytics";
import type { MetricTone } from "@/components/admin/analytics/MetricCard";

const showP95Latency = false;
export interface UsageMetricDefinition {
  key: string;
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone: MetricTone;
}

function formatPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function useUsageSummaryMetrics(
  summary?: UsageSummaryData,
  breakdown?: ProjectUsageBreakdownData,
  isLoading = false,
) {
  const { t, i18n } = useTranslation();

  return useMemo(() => {
    const totalRequests = summary?.totalRequests ?? 0;
    const totalPromptTokens = summary?.totalPromptTokens ?? 0;
    const totalCompletionTokens = summary?.totalCompletionTokens ?? 0;
    const errorRate = breakdown?.errorRate ?? 0;
    const p95LatencyMs = breakdown?.p95LatencyMs ?? null;
    const byIntent = summary?.byIntent ?? {};
    const byModel = summary?.byModel ?? {};
    const byApiKey = summary?.byApiKey ?? {};

    const metrics: UsageMetricDefinition[] = [
      {
        key: "requests",
        label: t("usage.metrics.requests"),
        value: formatCompactNumber(totalRequests, i18n.language),
        hint: t("usage.metrics.requestsHint"),
        icon: MessageSquare,
        tone: "primary",
      },
      {
        key: "promptTokens",
        label: t("usage.metrics.promptTokens"),
        value: formatCompactNumber(totalPromptTokens, i18n.language),
        hint: t("usage.metrics.promptTokensHint"),
        icon: ArrowDownUp,
        tone: "info",
      },
      {
        key: "completionTokens",
        label: t("usage.metrics.completionTokens"),
        value: formatCompactNumber(totalCompletionTokens, i18n.language),
        hint: t("usage.metrics.completionTokensHint"),
        icon: ArrowDownUp,
        tone: "accent",
      },
      {
        key: "errorRate",
        label: t("usage.metrics.errorRate"),
        value: formatPercent(errorRate, i18n.language),
        hint: t("usage.metrics.errorRateHint"),
        icon: AlertTriangle,
        tone: errorRate > 0.05 ? "warning" : "success",
      },
    ];

    if (p95LatencyMs != null && showP95Latency) {
      metrics.push({
        key: "p95Latency",
        label: t("usage.metrics.p95Latency"),
        value: formatCompactNumber(p95LatencyMs, i18n.language),
        hint: t("usage.metrics.p95LatencyHint"),
        icon: Clock,
        tone: "info",
      });
    }

    const intentEntries = Object.entries(byIntent).sort((a, b) => b[1] - a[1]);
    const modelEntries = Object.entries(byModel).sort((a, b) => b[1] - a[1]);
    const apiKeyEntries = Object.entries(byApiKey).sort((a, b) => b[1] - a[1]);
    const topIntentCount = intentEntries[0]?.[1] ?? 0;
    const topModelCount = modelEntries[0]?.[1] ?? 0;
    const topApiKeyCount = apiKeyEntries[0]?.[1] ?? 0;

    return {
      isLoading,
      metrics,
      intentEntries,
      modelEntries,
      apiKeyEntries,
      topIntentCount,
      topModelCount,
      topApiKeyCount,
      totalRequests,
    };
  }, [breakdown, i18n.language, isLoading, summary, t]);
}
