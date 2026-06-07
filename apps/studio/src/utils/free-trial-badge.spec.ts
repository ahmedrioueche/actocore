import { describe, expect, it } from 'vitest';

import type { StudioPlan } from '@ahmedrioueche/actocore-shared';

import { resolveFreeTrialBadge } from './free-trial-badge';

const freePlan: StudioPlan = {
  id: '1',
  planId: 'free',
  level: 'free',
  name: 'Free',
  trialDays: 14,
  pricing: { USD: { monthly: 0, yearly: 0 } },
  limits: { maxProjects: 1, maxTeamSeats: 1, monthlyChatQuota: 500 },
  createdAt: new Date().toISOString(),
};

describe('resolveFreeTrialBadge', () => {
  it('shows days badge for eligible users', () => {
    expect(resolveFreeTrialBadge(freePlan, undefined, false)).toBe('days');
  });

  it('shows days badge while trialing', () => {
    expect(
      resolveFreeTrialBadge(
        freePlan,
        { hasUsedTrial: true, isTrialing: true },
        false,
      ),
    ).toBe('days');
  });

  it('shows expired after trial ends', () => {
    expect(
      resolveFreeTrialBadge(
        freePlan,
        { hasUsedTrial: true, isTrialing: false },
        false,
      ),
    ).toBe('expired');
  });

  it('shows expired after upgrading to a paid plan', () => {
    expect(
      resolveFreeTrialBadge(
        freePlan,
        { hasUsedTrial: true, isTrialing: false },
        true,
      ),
    ).toBe('expired');
  });

  it('returns undefined for paid plans', () => {
    expect(
      resolveFreeTrialBadge(
        { ...freePlan, planId: 'starter', level: 'starter', trialDays: 0 },
        undefined,
        false,
      ),
    ).toBeUndefined();
  });
});
