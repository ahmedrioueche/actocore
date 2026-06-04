import { isDowngrade, isUpgrade } from './plan-level.util';

describe('plan-level.util', () => {
  it('detects upgrade and downgrade', () => {
    expect(isUpgrade('starter', 'pro')).toBe(true);
    expect(isDowngrade('pro', 'starter')).toBe(true);
    expect(isUpgrade('pro', 'starter')).toBe(false);
  });
});
