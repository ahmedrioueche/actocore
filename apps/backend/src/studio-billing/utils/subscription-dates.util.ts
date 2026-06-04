import type { AppSubscriptionBillingCycle } from '@ahmedrioueche/actocore-shared';

export function calculateSubscriptionDates(
  start: Date,
  billingCycle: AppSubscriptionBillingCycle,
): {
  currentPeriodEnd: Date;
  nextPaymentDate: Date;
  endDate?: Date;
} {
  const currentPeriodEnd = new Date(start);
  if (billingCycle === 'yearly') {
    currentPeriodEnd.setUTCFullYear(currentPeriodEnd.getUTCFullYear() + 1);
  } else {
    currentPeriodEnd.setUTCMonth(currentPeriodEnd.getUTCMonth() + 1);
  }
  return {
    currentPeriodEnd,
    nextPaymentDate: new Date(currentPeriodEnd),
    endDate: new Date(currentPeriodEnd),
  };
}
