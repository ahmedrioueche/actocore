import type { i18n as I18nInstance } from 'i18next';

import { routing } from '@/i18n/routing';

/** Merge web `playground.*` strings into the SDK i18n instance used inside ActocoreProvider. */
export function buildPlaygroundSdkTranslations(
  webI18n: I18nInstance,
  rateLimitMessage: string,
  activeLocale: string,
): Record<string, Record<string, unknown>> {
  const translations: Record<string, Record<string, unknown>> = {};

  for (const locale of routing.locales) {
    const bundle = webI18n.getResourceBundle(locale, 'translation') as
      | { playground?: Record<string, unknown> }
      | undefined;

    translations[locale] = {
      playground: bundle?.playground ?? {},
      ...(locale === activeLocale
        ? { errors: { TOO_MANY_REQUESTS: rateLimitMessage } }
        : {}),
    };
  }

  return translations;
}
