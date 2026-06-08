import type { AppSubscriptionBillingCycle, StudioPlan } from '@ahmedrioueche/actocore-shared';
import type { TFunction } from 'i18next';

export function resolveYearlyDiscountBadge(
  plan: StudioPlan,
  billingCycle: AppSubscriptionBillingCycle,
  t: TFunction,
): string | null {
  if (billingCycle !== 'yearly' || plan.level === 'free') {
    return null;
  }

  const pricing = plan.pricing.USD ?? plan.pricing.EUR;
  if (pricing?.yearly == null) {
    return null;
  }

  const custom = plan.yearlyDiscountBadge?.trim();
  if (custom) {
    return custom;
  }

  return t('subscription.plans.yearDiscountDefault');
}
