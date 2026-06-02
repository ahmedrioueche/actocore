import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { ActocoreI18nConfig, ActocoreI18nInstance } from '../config/types';
import en from './locales/en.json';
import fr from './locales/fr.json';

const BUNDLED_LOCALES: Record<string, Record<string, unknown>> = {
  en,
  fr,
};

function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...base };
  for (const key of Object.keys(override)) {
    const value = override[key];
    const existing = result[key];
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      existing &&
      typeof existing === 'object' &&
      !Array.isArray(existing)
    ) {
      result[key] = deepMerge(
        existing as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function buildResources(
  custom?: ActocoreI18nConfig['translations'],
): Record<string, { translation: Record<string, unknown> }> {
  const resources: Record<string, { translation: Record<string, unknown> }> =
    {};

  for (const [locale, bundle] of Object.entries(BUNDLED_LOCALES)) {
    const customBundle = custom?.[locale];
    resources[locale] = {
      translation: customBundle
        ? (deepMerge(bundle, customBundle) as Record<string, unknown>)
        : bundle,
    };
  }

  if (custom) {
    for (const [locale, bundle] of Object.entries(custom)) {
      if (resources[locale]) {
        continue;
      }
      const base = BUNDLED_LOCALES.en ?? {};
      resources[locale] = {
        translation: deepMerge(base, bundle) as Record<string, unknown>,
      };
    }
  }

  return resources;
}

export function createActocoreI18n(
  config: ActocoreI18nConfig,
): ActocoreI18nInstance {
  const instance = i18n.createInstance();
  const locale = config.locale ?? 'en';

  void instance.use(initReactI18next).init({
    resources: buildResources(config.translations),
    lng: locale,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  return instance;
}
