import { evaluateTrialEligibility } from './studio-trial.util';

describe('evaluateTrialEligibility', () => {
  const base = {
    planLevel: 'free' as const,
    planTrialDays: 14,
    planIsActive: true,
    hasUsedTrial: false,
    hasActiveSubscription: false,
  };

  it('allows first trial on the free plan', () => {
    expect(evaluateTrialEligibility(base)).toEqual({
      eligible: true,
      trialDays: 14,
    });
  });

  it('rejects paid plans and used trial', () => {
    expect(
      evaluateTrialEligibility({ ...base, planLevel: 'starter' }).reason,
    ).toBe('PAID_PLAN');
    expect(
      evaluateTrialEligibility({ ...base, hasUsedTrial: true }).reason,
    ).toBe('ALREADY_USED');
    expect(
      evaluateTrialEligibility({ ...base, hasActiveSubscription: true }).reason,
    ).toBe('ALREADY_SUBSCRIBED');
    expect(
      evaluateTrialEligibility({ ...base, planTrialDays: 0 }).reason,
    ).toBe('NO_TRIAL_ON_PLAN');
  });
});
