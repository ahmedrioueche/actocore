import type { StudioPlan, StudioTrialStatus } from '@ahmedrioueche/actocore-shared';

export type FreeTrialBadgeState = 'days' | 'expired';

export function resolveFreeTrialBadge(
  plan: StudioPlan,
  trial: StudioTrialStatus | undefined,
  hasPaidPayPalSub: boolean,
): FreeTrialBadgeState | undefined {
  if (plan.level !== 'free' || plan.trialDays == null || plan.trialDays <= 0) {
    return undefined;
  }
  if (hasPaidPayPalSub) {
    return 'expired';
  }
  if (trial?.isTrialing) {
    return 'days';
  }
  if (trial?.hasUsedTrial) {
    return 'expired';
  }
  return 'days';
}
