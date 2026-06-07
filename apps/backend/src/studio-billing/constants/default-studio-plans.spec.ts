import { describe, expect, it } from '@jest/globals';

import {
  DEFAULT_STUDIO_PLANS,
  DEPRECATED_PLAN_IDS,
  PUBLIC_PAID_PLAN_IDS,
} from './default-studio-plans';

describe('default-studio-plans', () => {
  it('defines free plus two paid tiers', () => {
    expect(DEFAULT_STUDIO_PLANS.map((p) => p.planId)).toEqual([
      'free',
      'starter',
      'pro',
    ]);
    expect(PUBLIC_PAID_PLAN_IDS).toEqual(['starter', 'pro']);
  });

  it('includes feature bullets for each plan', () => {
    for (const plan of DEFAULT_STUDIO_PLANS) {
      expect(plan.features?.length).toBeGreaterThan(0);
    }
  });

  it('marks premium as deprecated', () => {
    expect(DEPRECATED_PLAN_IDS).toContain('premium');
    expect(
      DEFAULT_STUDIO_PLANS.some((plan) => plan.planId === 'premium'),
    ).toBe(false);
  });
});
