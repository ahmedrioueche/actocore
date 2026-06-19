import { describe, expect, it } from 'vitest';

import {
  applyTranslatedLabelsToForm,
  buildTranslateSourceLabels,
  createDefaultSdkConfigFormState,
  resolveTranslateTargetLocales,
} from '@/utils/sdk-config-form';

describe('sdk-config-form translate helpers', () => {
  it('buildTranslateSourceLabels omits blank fields', () => {
    const state = createDefaultSdkConfigFormState();
    state.labelTextsByLocale.en = {
      ...state.labelTextsByLocale.en,
      headerTitle: 'My assistant',
      placeholder: '   ',
    };

    const result = buildTranslateSourceLabels(state, 'en');

    expect(result.headerTitle).toBe('My assistant');
    expect(result.placeholder).toBeUndefined();
  });

  it('resolveTranslateTargetLocales uses active tab or all non-default locales', () => {
    const state = createDefaultSdkConfigFormState();
    state.defaultLocale = 'en';
    state.supportedLocales = ['en', 'fr', 'de'];

    expect(resolveTranslateTargetLocales(state, 'de')).toEqual(['de']);
    expect(resolveTranslateTargetLocales(state, 'en')).toEqual(['fr', 'de']);
  });

  it('applyTranslatedLabelsToForm merges translations per locale', () => {
    const state = createDefaultSdkConfigFormState();
    state.defaultLocale = 'en';
    state.supportedLocales = ['en', 'fr'];

    const next = applyTranslatedLabelsToForm(state, {
      fr: {
        headerTitle: 'Assistant FR',
        placeholder: 'Écrivez un message…',
      },
    });

    expect(next.labelTextsByLocale.fr.headerTitle).toBe('Assistant FR');
    expect(next.labelTextsByLocale.fr.placeholder).toBe('Écrivez un message…');
    expect(next.labelTextsByLocale.en).toEqual(state.labelTextsByLocale.en);
  });
});
