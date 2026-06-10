import 'reflect-metadata';

import { describe, expect, it } from '@jest/globals';
import {
  mapLegacyPlanFeatureToId,
  normalizeStudioPlanLocaleText,
  sanitizeStudioPlanFeatures,
  sanitizeStudioPlanLocaleText,
} from '@ahmedrioueche/actocore-shared';

describe('studio plan normalize', () => {
  it('maps legacy English feature labels to catalog IDs', () => {
    expect(mapLegacyPlanFeatureToId('Email support')).toBe('email_support');
    expect(mapLegacyPlanFeatureToId('Everything in Free')).toBe(
      'everything_in_free',
    );
    expect(mapLegacyPlanFeatureToId('unknown')).toBeNull();
  });

  it('sanitizes features to known IDs without duplicates', () => {
    expect(
      sanitizeStudioPlanFeatures([
        'Email support',
        'email_support',
        'priority_support',
        'not-a-feature',
      ]),
    ).toEqual(['email_support', 'priority_support']);
  });

  it('coerces legacy description strings to locale objects', () => {
    expect(normalizeStudioPlanLocaleText('  Hello  ')).toEqual({ en: 'Hello' });
    expect(normalizeStudioPlanLocaleText({ en: ' EN ', fr: '' })).toEqual({
      en: 'EN',
    });
  });

  it('drops empty locale text on sanitize', () => {
    expect(sanitizeStudioPlanLocaleText({ en: '  ', fr: '' })).toBeUndefined();
    expect(sanitizeStudioPlanLocaleText({ fr: 'Badge' })).toEqual({
      fr: 'Badge',
    });
  });
});
