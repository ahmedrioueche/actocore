import { isUpgrade } from './plan-level.util';

describe('plan-level.util', () => {
  it('detects upgrade', () => {
    expect(isUpgrade('starter', 'pro')).toBe(true);
    expect(isUpgrade('pro', 'starter')).toBe(false);
  });
});
