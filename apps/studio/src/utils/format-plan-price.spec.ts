import { describe, expect, it } from 'vitest';
import type { StudioPlan } from '@ahmedrioueche/actocore-shared';

import { formatPlanPrice, hasPaidPlanPricing } from './format-plan-price';

const basePlan: StudioPlan = {
  planId: 'starter',
  level: 'starter',
  name: 'Starter',
  description: '',
  features: [],
  limits: {},
  pricing: {
    USD: { monthly: 29, yearly: 290 },
  },
  trialDays: 0,
  isRecommended: false,
  isActive: true,
  sortOrder: 1,
};

describe('formatPlanPrice', () => {
  it('formats monthly USD price', () => {
    const result = formatPlanPrice(basePlan, 'monthly', 'en-US');
    expect(result).toEqual({
      rawAmount: 29,
      currency: 'USD',
      amount: '$29',
    });
  });

  it('formats yearly USD price', () => {
    const result = formatPlanPrice(basePlan, 'yearly', 'en-US');
    expect(result?.rawAmount).toBe(290);
    expect(result?.currency).toBe('USD');
  });

  it('prefers EUR when USD is absent', () => {
    const eurPlan: StudioPlan = {
      ...basePlan,
      pricing: { EUR: { monthly: 25, yearly: 250 } },
    };
    const result = formatPlanPrice(eurPlan, 'monthly', 'fr-FR');
    expect(result?.currency).toBe('EUR');
    expect(result?.rawAmount).toBe(25);
  });

  it('returns null when pricing is missing', () => {
    const freePlan: StudioPlan = {
      ...basePlan,
      pricing: {},
    };
    expect(formatPlanPrice(freePlan, 'monthly')).toBeNull();
  });
});

describe('hasPaidPlanPricing', () => {
  it('returns true when monthly or yearly is set', () => {
    expect(hasPaidPlanPricing(basePlan)).toBe(true);
  });

  it('returns false for empty pricing', () => {
    expect(hasPaidPlanPricing({ ...basePlan, pricing: {} })).toBe(false);
  });
});
