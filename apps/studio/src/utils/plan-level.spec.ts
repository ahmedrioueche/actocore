import { describe, expect, it } from 'vitest';

import { comparePlanLevel, isDowngrade, isUpgrade } from './plan-level';

describe('plan-level', () => {
  it('orders tiers from free to premium', () => {
    expect(comparePlanLevel('free', 'starter')).toBeGreaterThan(0);
    expect(comparePlanLevel('pro', 'starter')).toBeLessThan(0);
  });

  it('detects upgrades and downgrades', () => {
    expect(isUpgrade('starter', 'pro')).toBe(true);
    expect(isDowngrade('pro', 'starter')).toBe(true);
    expect(isUpgrade('pro', 'pro')).toBe(false);
    expect(isDowngrade('starter', 'starter')).toBe(false);
  });
});
