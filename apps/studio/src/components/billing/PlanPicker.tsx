import type {
  AppPlanLevel,
  AppSubscriptionBillingCycle,
  StudioPlan,
  StudioSubscription,
  StudioTrialStatus,
} from "@ahmedrioueche/actocore-shared";
import { useTranslation } from "react-i18next";

import { PlanCard, type PlanActionKind } from "@/components/billing/PlanCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/utils/helper";
import { resolveFreeTrialBadge } from "@/utils/free-trial-badge";
import { isUpgrade } from "@/utils/plan-level";
import { SUBSCRIPTION_PLANS_SECTION_ID } from "@/utils/scroll";

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
  if (hasPaidPayPalSub) {
    if (isUpgrade(currentLevel, plan.level)) {
      return "upgrade";
    }
    return "unavailable";
  }
  return "subscribe";
}

interface PlanPickerProps {
  plans: StudioPlan[] | undefined;
  subscription: StudioSubscription | null | undefined;
  trial?: StudioTrialStatus;
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
  trial,
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
  const visiblePlans = [...(plans ?? [])]
    .filter((plan) => plan.level !== "free")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <section
      id={SUBSCRIPTION_PLANS_SECTION_ID}
      className="scroll-mt-6 space-y-4"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            {t("subscription.plans.title")}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {t("subscription.plans.subtitle")}
          </p>
        </div>

        {!hasPaidPayPalSub ? (
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
        ) : null}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-4",
            visiblePlans.length >= 3
              ? "md:grid-cols-2 lg:grid-cols-3"
              : "md:grid-cols-2",
          )}
        >
          {visiblePlans.map((plan) => {
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
                freeTrialBadge={resolveFreeTrialBadge(
                  plan,
                  trial,
                  hasPaidPayPalSub,
                )}
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
