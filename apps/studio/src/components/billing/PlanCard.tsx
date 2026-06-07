import type {
  AppSubscriptionBillingCycle,
  StudioPlan,
} from "@ahmedrioueche/actocore-shared";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/Button";
import { cn } from "@/utils/helper";

export type PlanActionKind =
  | "current"
  | "subscribe"
  | "trial"
  | "upgrade"
  | "downgrade"
  | "unavailable";

function formatPrice(
  plan: StudioPlan,
  billingCycle: AppSubscriptionBillingCycle,
): string | null {
  const pricing = plan.pricing.USD ?? plan.pricing.EUR;
  if (!pricing) {
    return null;
  }
  const amount = billingCycle === "yearly" ? pricing.yearly : pricing.monthly;
  if (amount == null) {
    return null;
  }
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: plan.pricing.USD ? "USD" : "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface PlanCardProps {
  plan: StudioPlan;
  billingCycle: AppSubscriptionBillingCycle;
  action: PlanActionKind;
  canWrite: boolean;
  isPending: boolean;
  onSelect: () => void;
}

export function PlanCard({
  plan,
  billingCycle,
  action,
  canWrite,
  isPending,
  onSelect,
}: PlanCardProps) {
  const { t } = useTranslation();
  const isCurrent = action === "current";
  const price = formatPrice(plan, billingCycle);

  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border bg-surface p-5 shadow-sm",
        isCurrent
          ? "border-2 border-primary bg-primary-muted shadow-brand"
          : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-text-primary">
            {plan.name}
          </h4>
          {plan.description ? (
            <p className="mt-1 text-sm text-text-secondary">
              {plan.description}
            </p>
          ) : null}
        </div>
        {isCurrent ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary bg-surface px-2 py-0.5 text-xs font-semibold text-primary">
            <Check className="h-3.5 w-3.5" aria-hidden />
            {t("subscription.plans.current")}
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-3xl font-bold text-text-primary">
        {price ?? t("subscription.plans.contactUs")}
        {price ? (
          <span className="ml-1 text-sm font-normal text-text-secondary">
            /{t(`subscription.plans.per.${billingCycle}`)}
          </span>
        ) : null}
      </p>

      <ul className="mt-4 space-y-2 text-sm text-text-secondary">
        {plan.features && plan.features.length > 0
          ? plan.features.map((feature) => <li key={feature}>{feature}</li>)
          : null}
        {!plan.features?.length && plan.limits.maxProjects != null ? (
          <li>
            {t("subscription.plans.limits.projects", {
              count: plan.limits.maxProjects,
            })}
          </li>
        ) : null}
        {!plan.features?.length && plan.limits.maxTeamSeats != null ? (
          <li>
            {t("subscription.plans.limits.seats", {
              count: plan.limits.maxTeamSeats,
            })}
          </li>
        ) : null}
        {!plan.features?.length && plan.limits.monthlyChatQuota != null ? (
          <li>
            {t("subscription.plans.limits.chat", {
              count: plan.limits.monthlyChatQuota,
            })}
          </li>
        ) : null}
      </ul>

      <div className="mt-auto pt-5">
        {canWrite && action !== "current" && action !== "unavailable" ? (
          <Button
            fullWidth
            variant={action === "downgrade" ? "outline" : "filled"}
            loading={isPending}
            onClick={onSelect}
          >
            {t(`subscription.plans.actions.${action}`)}
          </Button>
        ) : isCurrent ? (
          <p className="text-center text-sm text-text-secondary">
            {t("subscription.plans.currentHint")}
          </p>
        ) : null}
      </div>
    </article>
  );
}
