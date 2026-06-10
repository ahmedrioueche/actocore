import { describe, expect, it } from '@jest/globals';

import {
  formatPayPalAmount,
  getPayPalRegularBillingCycleSequence,
  getPlanCurrencyAmount,
  pricingCycleChanged,
} from './studio-paypal-catalog.util';

describe('studio-paypal-catalog.util', () => {
  it('formats whole and fractional USD amounts', () => {
    expect(formatPayPalAmount(29)).toBe('29');
    expect(formatPayPalAmount(29.5)).toBe('29.50');
  });

  it('uses billing cycle sequence 2 when a trial precedes regular billing', () => {
    expect(getPayPalRegularBillingCycleSequence(0)).toBe(1);
    expect(getPayPalRegularBillingCycleSequence(14)).toBe(2);
  });

  it('reads default currency pricing rows', () => {
    expect(
      getPlanCurrencyAmount({ USD: { monthly: 29, yearly: 290 } }, 'monthly'),
    ).toBe(29);
  });

  it('detects pricing cycle changes', () => {
    expect(
      pricingCycleChanged(
        { USD: { monthly: 29, yearly: 290 } },
        { USD: { monthly: 35, yearly: 290 } },
      ),
    ).toEqual({ monthly: true, yearly: false });
  });
});
