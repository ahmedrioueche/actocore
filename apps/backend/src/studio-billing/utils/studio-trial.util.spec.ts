import { evaluateTrialEligibility } from './studio-trial.util';

describe('evaluateTrialEligibility', () => {
  const base = {
    planLevel: 'starter' as const,
    planTrialDays: 14,
    planIsActive: true,
    hasUsedTrial: false,
    hasActiveSubscription: false,
  };

  it('allows first trial on a paid plan', () => {
    expect(evaluateTrialEligibility(base)).toEqual({
      eligible: true,
      trialDays: 14,
    });
  });

  it('rejects free plan and used trial', () => {
    expect(
      evaluateTrialEligibility({ ...base, planLevel: 'free' }).reason,
    ).toBe('FREE_PLAN');
    expect(
      evaluateTrialEligibility({ ...base, hasUsedTrial: true }).reason,
    ).toBe('ALREADY_USED');
    expect(
      evaluateTrialEligibility({ ...base, hasActiveSubscription: true }).reason,
    ).toBe('ALREADY_SUBSCRIBED');
  });
});
