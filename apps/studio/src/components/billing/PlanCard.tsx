import type {
  AppSubscriptionBillingCycle,
  StudioPlan,
} from "@ahmedrioueche/actocore-shared";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/Button";
import type { FreeTrialBadgeState } from "@/utils/free-trial-badge";
import { cn } from "@/utils/helper";
import {
  formatPlanPrice,
  hasPaidPlanPricing,
} from "@/utils/format-plan-price";
import { resolvePlanLocaleText } from "@/utils/plan-locale-text";
import { resolveYearlyDiscountBadge } from "@/utils/plan-badges";
import { buildPlanBullets } from "@/utils/plan-bullets";

export type PlanActionKind =
  | "current"
  | "subscribe"
  | "trial"
  | "upgrade"
  | "unavailable";

interface PlanCardProps {
  plan: StudioPlan;
  billingCycle: AppSubscriptionBillingCycle;
  action: PlanActionKind;
  freeTrialBadge?: FreeTrialBadgeState;
  canWrite: boolean;
  isPending: boolean;
  onSelect: () => void;
}

export function PlanCard({
  plan,
  billingCycle,
  action,
  freeTrialBadge,
  canWrite,
  isPending,
  onSelect,
}: PlanCardProps) {
  const { t, i18n } = useTranslation();
  const isCurrent = action === "current";
  const isRecommended = Boolean(plan.isRecommended);
  const price = formatPlanPrice(plan, billingCycle, i18n.language)?.amount ?? null;
  const showRecurringHint = hasPaidPlanPricing(plan);
  const bullets = buildPlanBullets(plan, t);
  const description = resolvePlanLocaleText(plan.description, i18n.language);
  const yearlyDiscountBadge = resolveYearlyDiscountBadge(
    plan,
    billingCycle,
    t,
    i18n.language,
  );

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-2xl border bg-surface p-5 shadow-sm",
        (isRecommended || yearlyDiscountBadge) && "mt-3",
        isCurrent
          ? "border-2 border-primary bg-primary-muted shadow-brand"
          : isRecommended
            ? "border-2 border-primary"
            : "border-border",
      )}
    >
      {isRecommended ? (
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
          <span className="inline-flex rounded-full bg-brand-gradient px-3 py-1 text-xs font-semibold text-primary-contrast shadow-sm">
            {t("subscription.plans.recommended")}
          </span>
        </div>
      ) : null}

      {yearlyDiscountBadge ? (
        <div className="pointer-events-none absolute right-4 top-7 z-10 -translate-y-1/2">
          <span className="inline-flex rounded-full border border-primary bg-primary-muted px-2.5 py-0.5 text-xs font-semibold text-primary shadow-sm">
            {yearlyDiscountBadge}
          </span>
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-text-primary">
            {plan.name}
          </h4>
          {description ? (
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {freeTrialBadge === "days" ? (
            <span className="inline-flex rounded-full border border-primary bg-primary-muted px-2 py-0.5 text-xs font-semibold text-primary">
              {t("subscription.plans.trialBadge", { days: plan.trialDays })}
            </span>
          ) : null}
          {freeTrialBadge === "expired" ? (
            <span className="inline-flex rounded-full border border-border bg-surface-secondary px-2 py-0.5 text-xs font-semibold text-text-secondary">
              {t("subscription.plans.trialExpired")}
            </span>
          ) : null}
          {isCurrent ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary bg-surface px-2 py-0.5 text-xs font-semibold text-primary">
              <Check className="h-3.5 w-3.5" aria-hidden />
              {t("subscription.plans.current")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-3xl font-bold text-text-primary">
          {price ?? t("subscription.plans.contactUs")}
          {price ? (
            <span className="ml-1 text-sm font-normal text-text-secondary">
              /{t(`subscription.plans.per.${billingCycle}`)}
            </span>
          ) : null}
        </p>
        {showRecurringHint ? (
          <p className="mt-1 text-xs text-muted">
            {t("subscription.consent.recurringHint")}
          </p>
        ) : null}
      </div>

      <ul className="mt-4 space-y-2 text-sm text-text-secondary">
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>

      <div className="mt-auto pt-5">
        {canWrite && action !== "current" && action !== "unavailable" ? (
          <Button
            fullWidth
            variant="filled"
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
