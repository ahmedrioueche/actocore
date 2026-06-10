import type { AppPlanPricing } from '@ahmedrioueche/actocore-shared';

const DEFAULT_CURRENCY = 'USD';

export type PayPalBillingInterval = 'MONTH' | 'YEAR';

export function formatPayPalAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`Invalid PayPal amount: ${amount}`);
  }
  if (Number.isInteger(amount)) {
    return String(amount);
  }
  return amount.toFixed(2);
}

/** Regular (paid) billing cycle sequence — trials occupy sequence 1 when present. */
export function getPayPalRegularBillingCycleSequence(trialDays: number): number {
  return trialDays > 0 ? 2 : 1;
}

export function getPlanCurrencyAmount(
  pricing: AppPlanPricing | Record<string, { monthly?: number; yearly?: number }>,
  cycle: 'monthly' | 'yearly',
): number | undefined {
  const row = pricing[DEFAULT_CURRENCY];
  return cycle === 'monthly' ? row?.monthly : row?.yearly;
}

export function buildPayPalPlanName(
  planName: string,
  planId: string,
  cycle: 'monthly' | 'yearly',
): string {
  const cycleLabel = cycle === 'monthly' ? 'Monthly' : 'Yearly';
  return `ActoCore ${planName} (${planId}) ${cycleLabel}`;
}

export function pricingCycleChanged(
  previous: AppPlanPricing | Record<string, { monthly?: number; yearly?: number }>,
  next: AppPlanPricing | Record<string, { monthly?: number; yearly?: number }>,
): { monthly: boolean; yearly: boolean } {
  return {
    monthly:
      getPlanCurrencyAmount(previous, 'monthly') !==
      getPlanCurrencyAmount(next, 'monthly'),
    yearly:
      getPlanCurrencyAmount(previous, 'yearly') !==
      getPlanCurrencyAmount(next, 'yearly'),
  };
}

export function paidPlanNeedsPayPalSync(
  level: string,
  pricing: AppPlanPricing | Record<string, { monthly?: number; yearly?: number }>,
): boolean {
  if (level === 'free') {
    return false;
  }
  return (
    getPlanCurrencyAmount(pricing, 'monthly') != null ||
    getPlanCurrencyAmount(pricing, 'yearly') != null
  );
}
