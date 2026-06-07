import { describe, expect, it } from 'vitest';

import { comparePlanLevel, isUpgrade } from './plan-level';

describe('plan-level', () => {
  it('orders tiers from free to premium', () => {
    expect(comparePlanLevel('free', 'starter')).toBeGreaterThan(0);
    expect(comparePlanLevel('pro', 'starter')).toBeLessThan(0);
  });

  it('detects upgrades', () => {
    expect(isUpgrade('starter', 'pro')).toBe(true);
    expect(isUpgrade('pro', 'starter')).toBe(false);
    expect(isUpgrade('pro', 'pro')).toBe(false);
  });
});
