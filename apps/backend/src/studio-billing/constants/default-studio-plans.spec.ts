import 'reflect-metadata';

import { describe, expect, it } from '@jest/globals';
import { STUDIO_PLAN_FEATURE_IDS } from '@ahmedrioueche/actocore-shared';

import {
  DEFAULT_STUDIO_PLANS,
  DEPRECATED_PLAN_IDS,
  PUBLIC_PAID_PLAN_IDS,
} from './default-studio-plans';

describe('default-studio-plans', () => {
  it('defines free plus three paid tiers', () => {
    expect(DEFAULT_STUDIO_PLANS.map((p) => p.planId)).toEqual([
      'free',
      'starter',
      'pro',
      'business',
    ]);
    expect(PUBLIC_PAID_PLAN_IDS).toEqual(['starter', 'pro', 'business']);
  });

  it('includes catalog feature IDs for each plan', () => {
    for (const plan of DEFAULT_STUDIO_PLANS) {
      expect(plan.features?.length).toBeGreaterThan(0);
      for (const featureId of plan.features ?? []) {
        expect(STUDIO_PLAN_FEATURE_IDS).toContain(featureId);
      }
    }
  });

  it('stores localized description and yearly badge copy', () => {
    for (const plan of DEFAULT_STUDIO_PLANS) {
      expect(plan.description?.en).toBeTruthy();
    }

    for (const plan of DEFAULT_STUDIO_PLANS.filter((p) => p.level !== 'free')) {
      expect(plan.yearlyDiscountBadge?.en).toBeTruthy();
      expect(plan.yearlyDiscountBadge?.fr).toBeTruthy();
    }
  });

  it('defines project and team seat limits on every plan', () => {
    for (const plan of DEFAULT_STUDIO_PLANS) {
      expect(plan.limits.maxProjects).toBeGreaterThan(0);
      expect(plan.limits.maxTeamSeats).toBeGreaterThan(0);
      expect(plan.limits.monthlyTokenQuota).toBeGreaterThan(0);
      expect(plan.limits.maxActionsPerProject).toBeGreaterThan(0);
    }
  });

  it('marks premium as deprecated', () => {
    expect(DEPRECATED_PLAN_IDS).toContain('premium');
    expect(
      DEFAULT_STUDIO_PLANS.some((plan) => plan.planId === 'premium'),
    ).toBe(false);
  });
});
