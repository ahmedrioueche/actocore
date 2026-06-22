import type {
  AppSubscriptionBillingCycle,
  StudioPlan,
} from '@ahmedrioueche/actocore-shared';

export type FormattedPlanPrice = {
  amount: string;
  currency: string;
  rawAmount: number;
};

export function formatPlanPrice(
  plan: StudioPlan,
  billingCycle: AppSubscriptionBillingCycle,
  locale?: string,
): FormattedPlanPrice | null {
  const pricing = plan.pricing.USD ?? plan.pricing.EUR;
  if (!pricing) {
    return null;
  }

  const currency = plan.pricing.USD ? 'USD' : 'EUR';
  const rawAmount =
    billingCycle === 'yearly' ? pricing.yearly : pricing.monthly;
  if (rawAmount == null) {
    return null;
  }

  return {
    rawAmount,
    currency,
    amount: new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(rawAmount),
  };
}

export function hasPaidPlanPricing(plan: StudioPlan): boolean {
  const pricing = plan.pricing.USD ?? plan.pricing.EUR;
  if (!pricing) {
    return false;
  }
  return pricing.monthly != null || pricing.yearly != null;
}
