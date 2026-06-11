import { useNavigate } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PaymentHistoryTable } from "@/components/billing/PaymentHistoryTable";
import { PlanLimitTip } from "@/components/billing/PlanLimitTip";
import {
  UsageMeter,
  UsageMeterSkeleton,
} from "@/components/billing/UsageMeter";
import { PageHeader } from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Error from "@/components/ui/Error";
import {
  useBillingQuota,
  usePayPalManageUrl,
  usePaymentHistory,
} from "@/hooks/use-billing";
import { useSubscriptionSummary } from "@/hooks/use-subscription";
import { isAtPlanLimit } from "@/lib/plan-limits";
import { formatTokenCount } from "@/utils/format-token-count";

export default function BillingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const summaryQuery = useSubscriptionSummary();
  const quotaQuery = useBillingQuota();
  const historyQuery = usePaymentHistory({ page: 1, limit: 20 });
  const manageUrlQuery = usePayPalManageUrl();

  const isLoading = summaryQuery.isLoading || quotaQuery.isLoading;
  const isError = summaryQuery.isError || quotaQuery.isError;

  const summary = summaryQuery.data;
  const usage = summary?.usage;
  const limits = summary?.limits ?? {};
  const monthlyTokensUsed =
    quotaQuery.data?.monthlyTokensUsed ?? usage?.monthlyTokensUsed ?? 0;
  const monthlyTokenLimit =
    quotaQuery.data?.monthlyTokenLimit ?? limits.monthlyTokenQuota ?? null;
  const atProjectLimit = isAtPlanLimit(usage?.projectsUsed, limits.maxProjects);
  const atSeatLimit = isAtPlanLimit(usage?.teamSeatsUsed, limits.maxTeamSeats);
  const atTokenLimit = isAtPlanLimit(monthlyTokensUsed, monthlyTokenLimit);

  return (
    <>
      <PageHeader
        title={t("billing.title")}
        subtitle={t("billing.subtitle")}
        actions={
          <Button
            variant="outline"
            icon={<CreditCard className="h-4 w-4" />}
            onClick={() =>
              navigate({
                to: "/subscription",
                search: { subscriptionId: undefined, scrollTo: undefined },
              })
            }
          >
            {t("billing.manageSubscription")}
          </Button>
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
          {!isLoading && (atProjectLimit || atSeatLimit || atTokenLimit) ? (
            <div className="space-y-3">
              {atProjectLimit && limits.maxProjects != null ? (
                <PlanLimitTip kind="project" limit={limits.maxProjects} />
              ) : null}
              {atSeatLimit && limits.maxTeamSeats != null ? (
                <PlanLimitTip kind="seat" limit={limits.maxTeamSeats} />
              ) : null}
              {atTokenLimit && monthlyTokenLimit != null ? (
                <PlanLimitTip
                  kind="chat"
                  limit={monthlyTokenLimit}
                  formatLimit={formatTokenCount}
                />
              ) : null}
            </div>
          ) : null}

          <section className="space-y-5 rounded-2xl bg-surface p-6 shadow-sm md:p-8">
            <h3 className="text-lg font-semibold text-text-primary">
              {t("billing.usageTitle")}
            </h3>

            {isLoading ? (
              <>
                <UsageMeterSkeleton label={t("billing.projects")} />
                <UsageMeterSkeleton label={t("billing.teamSeats")} />
                <UsageMeterSkeleton label={t("billing.monthlyTokens")} />
              </>
            ) : (
              <>
                <UsageMeter
                  label={t("billing.projects")}
                  used={usage?.projectsUsed ?? 0}
                  limit={limits.maxProjects}
                />
                <UsageMeter
                  label={t("billing.teamSeats")}
                  used={usage?.teamSeatsUsed ?? 0}
                  limit={limits.maxTeamSeats}
                />
                <UsageMeter
                  label={t("billing.monthlyTokens")}
                  used={monthlyTokensUsed}
                  limit={monthlyTokenLimit}
                  formatValue={formatTokenCount}
                />
              </>
            )}
          </section>

          <section className="space-y-4 rounded-2xl bg-surface p-6 shadow-sm md:p-8">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                {t("billing.history.title")}
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                {t("billing.history.subtitle")}
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
