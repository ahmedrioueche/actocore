import {
  STUDIO_PLAN_TIER_INHERITANCE_PREFIX,
  type AppSubscriptionBillingCycle,
  type StudioPlan,
  type StudioPlanFeatureId,
  type StudioPlanLocaleText,
} from "@ahmedrioueche/actocore-shared";
import type { TFunction } from "i18next";

function formatTokenCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return "0";
  }
  if (value < 1_000) {
    return String(Math.round(value));
  }
  if (value < 1_000_000) {
    const thousands = value / 1_000;
    const rounded = Math.round(thousands * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}K`;
  }
  const millions = value / 1_000_000;
  const rounded = Math.round(millions * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}M`;
}

export function resolvePlanLocaleText(
  text: StudioPlanLocaleText | string | undefined,
  language: string,
): string | undefined {
  if (!text) {
    return undefined;
  }

  if (typeof text === "string") {
    const trimmed = text.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  const preferFrench = language.toLowerCase().startsWith("fr");
  const primary = preferFrench ? text.fr : text.en;
  const fallback = preferFrench ? text.en : text.fr;
  const chosen = primary?.trim() || fallback?.trim();
  return chosen && chosen.length > 0 ? chosen : undefined;
}

/** `t` must use the `pricing` key prefix (e.g. `useT('pricing')`). */
export function resolvePlanName(plan: StudioPlan, t: TFunction): string {
  return t(`plans.${plan.planId}.name`, {
    defaultValue: plan.name,
  });
}

/** `t` must use the `pricing` key prefix (e.g. `useT('pricing')`). */
export function resolvePlanDescription(
  plan: StudioPlan,
  t: TFunction,
  language: string,
): string {
  return t(`plans.${plan.planId}.description`, {
    defaultValue:
      resolvePlanLocaleText(plan.description, language) ?? plan.name,
  });
}

function translateFeature(id: StudioPlanFeatureId, t: TFunction): string {
  return t(`planFeatures.${id}`);
}

/** `t` must use the `pricing` key prefix (e.g. `useT('pricing')`). */
export function buildPlanBullets(plan: StudioPlan, t: TFunction): string[] {
  const bullets: string[] = [];
  const features = plan.features ?? [];
  const tierInheritance = features.filter((id) =>
    id.startsWith(STUDIO_PLAN_TIER_INHERITANCE_PREFIX),
  );
  const other = features.filter(
    (id) => !id.startsWith(STUDIO_PLAN_TIER_INHERITANCE_PREFIX),
  );

  const tokenBullet =
    plan.limits.monthlyTokenQuota != null
      ? t("planLimits.chat", {
          count: formatTokenCount(plan.limits.monthlyTokenQuota),
        })
      : null;

  if (tierInheritance.length > 0) {
    bullets.push(...tierInheritance.map((id) => translateFeature(id, t)));
    if (tokenBullet) {
      bullets.push(tokenBullet);
    }
    if (plan.limits.maxProjects != null) {
      bullets.push(
        t("planLimits.projects", { count: plan.limits.maxProjects }),
      );
    }
    if (plan.limits.maxTeamSeats != null) {
      bullets.push(t("planLimits.seats", { count: plan.limits.maxTeamSeats }));
    }
    bullets.push(...other.map((id) => translateFeature(id, t)));
  } else {
    bullets.push(...features.map((id) => translateFeature(id, t)));
    if (tokenBullet) {
      bullets.push(tokenBullet);
    }
    if (plan.limits.maxProjects != null) {
      bullets.push(
        t("planLimits.projects", { count: plan.limits.maxProjects }),
      );
    }
    if (plan.limits.maxTeamSeats != null) {
      bullets.push(t("planLimits.seats", { count: plan.limits.maxTeamSeats }));
    }
  }

  if (plan.limits.maxActionsPerProject != null) {
    bullets.push(
      t("planLimits.actionsPerProject", {
        count: plan.limits.maxActionsPerProject,
      }),
    );
  }

  return bullets;
}

export function formatPlanPrice(
  plan: StudioPlan,
  billingCycle: AppSubscriptionBillingCycle,
  locale: string,
): string | null {
  const pricing = plan.pricing.USD ?? plan.pricing.EUR;
  if (!pricing) {
    return null;
  }

  const amount = billingCycle === "yearly" ? pricing.yearly : pricing.monthly;
  if (amount == null) {
    return null;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: plan.pricing.USD ? "USD" : "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** `t` must use the `pricing` key prefix (e.g. `useT('pricing')`). */
export function resolveYearlyDiscountBadge(
  plan: StudioPlan,
  billingCycle: AppSubscriptionBillingCycle,
  t: TFunction,
  language: string,
): string | null {
  if (billingCycle !== "yearly" || plan.level === "free") {
    return null;
  }

  const pricing = plan.pricing.USD ?? plan.pricing.EUR;
  if (pricing?.yearly == null) {
    return null;
  }

  const fromApi = resolvePlanLocaleText(plan.yearlyDiscountBadge, language);
  if (fromApi) {
    return fromApi;
  }

  return t(`plans.${plan.planId}.yearDiscount`, {
    defaultValue: t("yearDiscountDefault"),
  });
}
