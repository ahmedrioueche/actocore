import type { StudioPlan } from "@ahmedrioueche/actocore-shared";
import {
  Building2,
  Check,
  Rocket,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { CtaButton } from "@/components/site/CtaButton";
import {
  PLAN_CARD_CTA_CLASS,
  resolvePlanCardTheme,
} from "@/constants/plan-card-theme";
import { useT } from "@/i18n/useT";
import {
  buildPlanBullets,
  formatPlanPrice,
  resolvePlanDescription,
  resolvePlanName,
  resolveYearlyDiscountBadge,
} from "@/lib/plan-display";
import { studioSignupPath, type SignupBillingCycle } from "@/lib/site";
import { cn } from "@/lib/utils";

const LEVEL_ICONS: Record<string, LucideIcon> = {
  free: Sparkles,
  starter: Rocket,
  pro: Zap,
  premium: Building2,
};

type BillingCycle = SignupBillingCycle;

function planGridClass(count: number): string {
  if (count <= 1) return "md:grid-cols-1";
  if (count === 2) return "md:grid-cols-2";
  if (count === 3) return "md:grid-cols-2 xl:grid-cols-3";
  return "md:grid-cols-2 xl:grid-cols-4";
}

type PricingPlansDeckProps = {
  plans: StudioPlan[];
  isLoading: boolean;
  error: string | null;
  cycle: BillingCycle;
  className?: string;
};

export function PricingPlansDeck({
  plans,
  isLoading,
  error,
  cycle,
  className,
}: PricingPlansDeckProps) {
  const { t, i18n } = useT("pricing");

  if (error) {
    return (
      <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-secondary">
        {t("loadError")}
      </p>
    );
  }

  return (
    <div
      className={cn("grid gap-6", planGridClass(plans.length || 4), className)}
    >
      {isLoading
        ? Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-[30rem] animate-pulse rounded-3xl border border-border bg-surface-secondary/80"
              aria-hidden
            />
          ))
        : plans.map((plan) => {
            const isRecommended = Boolean(plan.isRecommended);
            const theme = resolvePlanCardTheme(plan);
            const Icon = LEVEL_ICONS[plan.level] ?? Sparkles;
            const price = formatPlanPrice(plan, cycle, i18n.language);
            const period = cycle === "monthly" ? t("perMonth") : t("perYear");
            const name = resolvePlanName(plan, t);
            const description = resolvePlanDescription(plan, t, i18n.language);
            const bullets = buildPlanBullets(plan, t);
            const yearlyBadge = resolveYearlyDiscountBadge(
              plan,
              cycle,
              t,
              i18n.language,
            );
            const signupHref = studioSignupPath({
              planId: plan.level === "free" ? undefined : plan.planId,
              cycle: plan.level === "free" ? undefined : cycle,
            });

            return (
              <article
                key={plan.planId}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-3xl border p-6 transition-[transform,box-shadow,border-color] duration-300",
                  "glass-panel card-hover",
                  isRecommended
                    ? "border-primary shadow-brand lg:-translate-y-1"
                    : "border-border hover:border-primary/30",
                  isRecommended && "mt-3",
                )}
              >
                <div
                  className="absolute inset-x-0 top-0 z-[2] h-1.5"
                  style={{ backgroundColor: theme.topBorder }}
                  aria-hidden
                />
                <div
                  className={cn(
                    "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br to-transparent opacity-60 blur-2xl transition-opacity duration-300 group-hover:opacity-100",
                    theme.glow,
                  )}
                  aria-hidden
                />

                {isRecommended ? (
                  <span className="absolute left-1/2 top-3 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-gradient px-3.5 py-1 text-xs font-semibold text-primary-contrast shadow-md">
                    {t("recommended")}
                  </span>
                ) : null}

                <div className="relative z-[1] flex flex-1 flex-col">
                  <div
                    className={cn(
                      "mb-4 flex h-11 w-11 items-center justify-center rounded-2xl",
                      theme.iconRing,
                    )}
                  >
                    <Icon
                      className={cn("h-5 w-5", theme.iconColor)}
                      aria-hidden
                    />
                  </div>

                  <h3 className="text-xl font-bold text-text-primary">
                    {name}
                  </h3>
                  <p className="mt-2 min-h-[2.5rem] text-sm leading-relaxed text-text-secondary">
                    {description}
                  </p>

                  <div className="mt-6 pb-6">
                    <div className="flex flex-row items-baseline gap-1">
                      <p
                        className={cn(
                          "text-4xl font-extrabold tracking-tight",
                          theme.priceColor,
                        )}
                      >
                        {price ?? "—"}
                      </p>
                      {price ? (
                        <p className="text-sm text-text-secondary">{period}</p>
                      ) : null}
                    </div>
                    {yearlyBadge ? (
                      <p
                        className={cn(
                          "mt-2 text-xs font-semibold",
                          theme.yearlyBadge,
                        )}
                      >
                        {yearlyBadge}
                      </p>
                    ) : null}
                  </div>

                  <ul className="mt-6 flex-1 space-y-3 text-sm text-text-secondary">
                    {bullets.map((feature) => (
                      <li key={feature} className="flex gap-2.5">
                        <span
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                            theme.checkBg,
                          )}
                        >
                          <Check
                            className={cn("h-3 w-3", theme.checkIcon)}
                            strokeWidth={3}
                            aria-hidden
                          />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <CtaButton
                      href={signupHref}
                      variant="primary"
                      className={PLAN_CARD_CTA_CLASS}
                      style={{ backgroundColor: theme.buttonBg }}
                    >
                      {plan.level === "free" ? t("cta") : t("ctaPaid")}
                    </CtaButton>
                  </div>
                </div>
              </article>
            );
          })}
    </div>
  );
}

type BillingCycleToggleProps = {
  cycle: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  className?: string;
};

export function BillingCycleToggle({
  cycle,
  onChange,
  className,
}: BillingCycleToggleProps) {
  const { t } = useT("pricing");

  return (
    <div
      className={cn(
        "inline-flex rounded-xl border border-border bg-surface p-1 shadow-sm",
        className,
      )}
      role="group"
      aria-label={t("cycleLabel")}
    >
      {(["monthly", "yearly"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
            cycle === option
              ? "bg-primary text-primary-contrast shadow-sm"
              : "text-text-secondary hover:text-text-primary",
          )}
        >
          {t(option)}
        </button>
      ))}
    </div>
  );
}
