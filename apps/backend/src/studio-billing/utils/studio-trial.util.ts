import type { AppPlanLevel } from '@ahmedrioueche/actocore-shared';

export type TrialIneligibilityReason =
  | 'PAID_PLAN'
  | 'NO_TRIAL_ON_PLAN'
  | 'ALREADY_USED'
  | 'ALREADY_SUBSCRIBED'
  | 'PLAN_INACTIVE';

export function evaluateTrialEligibility(input: {
  planLevel: AppPlanLevel;
  planTrialDays: number;
  planIsActive: boolean;
  hasUsedTrial: boolean;
  hasActiveSubscription: boolean;
}): {
  eligible: boolean;
  trialDays?: number;
  reason?: TrialIneligibilityReason;
  message?: string;
} {
  if (!input.planIsActive) {
    return {
      eligible: false,
      reason: 'PLAN_INACTIVE',
      message: 'This plan is not available',
    };
  }
  if (input.planLevel !== 'free') {
    return {
      eligible: false,
      reason: 'PAID_PLAN',
      message: 'Free trial is only available on the free plan',
    };
  }
  if (input.planTrialDays <= 0) {
    return {
      eligible: false,
      reason: 'NO_TRIAL_ON_PLAN',
      message: 'This plan has no trial period',
    };
  }
  if (input.hasUsedTrial) {
    return {
      eligible: false,
      reason: 'ALREADY_USED',
      message: 'This account has already used a free trial',
    };
  }
  if (input.hasActiveSubscription) {
    return {
      eligible: false,
      reason: 'ALREADY_SUBSCRIBED',
      message: 'Cancel your current subscription before starting a trial',
    };
  }
  return { eligible: true, trialDays: input.planTrialDays };
}
