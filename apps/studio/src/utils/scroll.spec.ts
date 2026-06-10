import { describe, expect, it } from 'vitest';

import { SUBSCRIPTION_PLANS_SECTION_ID } from '@/utils/scroll';

describe('scroll utilities', () => {
  it('exposes a stable id for the subscription plans section', () => {
    expect(SUBSCRIPTION_PLANS_SECTION_ID).toBe('subscription-plans');
  });
});
