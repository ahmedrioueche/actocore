import { DollarSign, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatCurrency } from "@/components/admin/analytics/format-analytics";
import { Skeleton } from "@/components/ui/Skeleton";

interface RevenueHeroCardProps {
  estimatedMrr?: number;
  activeSubscriptions?: number;
  isLoading?: boolean;
}

export function RevenueHeroCard({
  estimatedMrr = 0,
  activeSubscriptions = 0,
  isLoading = false,
}: RevenueHeroCardProps) {
  const { t, i18n } = useTranslation();
  const arpu = activeSubscriptions > 0 ? estimatedMrr / activeSubscriptions : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm md:p-8">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent"
        aria-hidden
      />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
            {t("admin.analytics.revenue.badge")}
          </div>
          <p className="text-sm font-medium text-text-secondary">
            {t("admin.analytics.revenue.title")}
          </p>
          {isLoading ? (
            <Skeleton className="mt-3 h-12 w-40" />
          ) : (
            <p className="mt-2 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
              {formatCurrency(estimatedMrr, i18n.language)}
            </p>
          )}
          <p className="mt-2 max-w-xl text-sm text-text-secondary">
            {t("admin.analytics.revenue.description")}
          </p>
        </div>
        <div className="grid w-full max-w-sm grid-cols-2 gap-3">
          <div className="rounded-xl border border-primary bg-background/70 p-4 backdrop-blur-sm">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient-soft text-primary">
              <DollarSign className="h-4 w-4" aria-hidden />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              {t("admin.analytics.revenue.activeSubs")}
            </p>
            {isLoading ? (
              <Skeleton className="mt-2 h-7 w-12" />
            ) : (
              <p className="mt-1 text-2xl font-bold text-text-primary">
                {activeSubscriptions}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-primary bg-background/70 p-4 backdrop-blur-sm">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
              <TrendingUp className="h-4 w-4" aria-hidden />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              {t("admin.analytics.revenue.arpu")}
            </p>
            {isLoading ? (
              <Skeleton className="mt-2 h-7 w-16" />
            ) : (
              <p className="mt-1 text-2xl font-bold text-text-primary">
                {formatCurrency(arpu, i18n.language)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
