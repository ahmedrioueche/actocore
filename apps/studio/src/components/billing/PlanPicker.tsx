import type {
  AppPlanLevel,
  AppSubscriptionBillingCycle,
  StudioPlan,
  StudioSubscription,
} from "@ahmedrioueche/actocore-shared";
import { useTranslation } from "react-i18next";

import { PlanCard, type PlanActionKind } from "@/components/billing/PlanCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/utils/helper";
import { isDowngrade, isUpgrade } from "@/utils/plan-level";

export type { PlanActionKind };

function resolvePlanAction(
  plan: StudioPlan,
  currentLevel: AppPlanLevel,
  currentPlanId: string | undefined,
  hasPaidPayPalSub: boolean,
): PlanActionKind {
  if (plan.planId === currentPlanId) {
    return "current";
  }
  if (plan.level === "free") {
    return "unavailable";
  }
  if (hasPaidPayPalSub) {
    if (isUpgrade(currentLevel, plan.level)) {
      return "upgrade";
    }
    if (isDowngrade(currentLevel, plan.level)) {
      return "downgrade";
    }
    return "subscribe";
  }
  return "subscribe";
}

interface PlanPickerProps {
  plans: StudioPlan[] | undefined;
  subscription: StudioSubscription | null | undefined;
  billingCycle: AppSubscriptionBillingCycle;
  onBillingCycleChange: (cycle: AppSubscriptionBillingCycle) => void;
  isLoading: boolean;
  canWrite: boolean;
  pendingPlanId: string | null;
  onSelectPlan: (plan: StudioPlan, action: PlanActionKind) => void;
}

export function PlanPicker({
  plans,
  subscription,
  billingCycle,
  onBillingCycleChange,
  isLoading,
  canWrite,
  pendingPlanId,
  onSelectPlan,
}: PlanPickerProps) {
  const { t } = useTranslation();
  const currentLevel: AppPlanLevel = subscription?.plan?.level ?? "free";
  const currentPlanId = subscription?.planId;
  const hasPaidPayPalSub = Boolean(subscription?.paypalSubscriptionId);
  const paidPlans = (plans ?? []).filter((plan) => plan.level !== "free");

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            {t("subscription.plans.title")}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {t("subscription.plans.subtitle")}
          </p>
        </div>

        <div
          className="inline-flex rounded-xl border border-border bg-surface p-1"
          role="group"
          aria-label={t("subscription.plans.cycleLabel")}
        >
          {(["monthly", "yearly"] as const).map((cycle) => (
            <button
              key={cycle}
              type="button"
              onClick={() => onBillingCycleChange(cycle)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                billingCycle === cycle
                  ? "bg-brand-gradient text-primary-contrast shadow-sm"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              {t(`subscription.billingCycle.${cycle}`)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {paidPlans.map((plan) => {
            const action = resolvePlanAction(
              plan,
              currentLevel as AppPlanLevel,
              currentPlanId,
              hasPaidPayPalSub,
            );

            return (
              <PlanCard
                key={plan.planId}
                plan={plan}
                billingCycle={billingCycle}
                action={action}
                canWrite={canWrite}
                isPending={pendingPlanId === plan.planId}
                onSelect={() => onSelectPlan(plan, action)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
