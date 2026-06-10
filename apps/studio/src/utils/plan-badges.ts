import type { AppSubscriptionBillingCycle, StudioPlan } from '@ahmedrioueche/actocore-shared';
import type { TFunction } from 'i18next';

import { resolvePlanLocaleText } from '@/utils/plan-locale-text';

export function resolveYearlyDiscountBadge(
  plan: StudioPlan,
  billingCycle: AppSubscriptionBillingCycle,
  t: TFunction,
  language: string,
): string | null {
  if (billingCycle !== 'yearly' || plan.level === 'free') {
    return null;
  }

  const pricing = plan.pricing.USD ?? plan.pricing.EUR;
  if (pricing?.yearly == null) {
    return null;
  }

  const custom = resolvePlanLocaleText(plan.yearlyDiscountBadge, language);
  if (custom) {
    return custom;
  }

  return t('subscription.plans.yearDiscountDefault');
}
