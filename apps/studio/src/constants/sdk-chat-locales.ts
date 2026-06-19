/** SDK ships bundled UI strings for these locales. */
export const SDK_BUNDLED_CHAT_LOCALES = ['en', 'fr'] as const;

export type SdkBundledChatLocale = (typeof SDK_BUNDLED_CHAT_LOCALES)[number];

/** Quick-add presets in Studio (custom codes are also allowed). */
export const SDK_CHAT_LOCALE_PRESETS = [
  { code: 'en', labelKey: 'sdkConfig.fields.chatLocales.en' },
  { code: 'fr', labelKey: 'sdkConfig.fields.chatLocales.fr' },
  { code: 'de', labelKey: 'sdkConfig.fields.chatLocales.de' },
  { code: 'es', labelKey: 'sdkConfig.fields.chatLocales.es' },
  { code: 'pt', labelKey: 'sdkConfig.fields.chatLocales.pt' },
  { code: 'it', labelKey: 'sdkConfig.fields.chatLocales.it' },
  { code: 'nl', labelKey: 'sdkConfig.fields.chatLocales.nl' },
  { code: 'ar', labelKey: 'sdkConfig.fields.chatLocales.ar' },
  { code: 'ja', labelKey: 'sdkConfig.fields.chatLocales.ja' },
  { code: 'zh', labelKey: 'sdkConfig.fields.chatLocales.zh' },
] as const;

/** @deprecated Use SDK_CHAT_LOCALE_PRESETS */
export const SDK_CHAT_LOCALE_OPTIONS = SDK_CHAT_LOCALE_PRESETS;

export const SDK_CONFIG_DEFAULT_CHAT_LOCALE = 'en';

export const SDK_CONFIG_DEFAULT_SUPPORTED_CHAT_LOCALES = ['en'] as const;

export const SDK_CONFIG_MAX_SUPPORTED_CHAT_LOCALES = 20;

const LOCALE_CODE_PATTERN = /^[a-z]{2,3}$/;

export function normalizeSdkChatLocaleCode(value: string): string | undefined {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.split('-')[0].slice(0, 35);
}

export function isValidSdkChatLocaleCode(value: string): boolean {
  const normalized = normalizeSdkChatLocaleCode(value);
  if (!normalized) {
    return false;
  }
  return LOCALE_CODE_PATTERN.test(normalized);
}

export function findChatLocalePreset(code: string) {
  return SDK_CHAT_LOCALE_PRESETS.find((preset) => preset.code === code);
}

export function normalizeSupportedChatLocales(
  locales: string[],
  defaultLocale: string,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const code of locales) {
    const normalized = normalizeSdkChatLocaleCode(code);
    if (!normalized || !isValidSdkChatLocaleCode(normalized) || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }

  const defaultNormalized = normalizeSdkChatLocaleCode(defaultLocale);
  if (
    defaultNormalized &&
    isValidSdkChatLocaleCode(defaultNormalized) &&
    !seen.has(defaultNormalized)
  ) {
    result.unshift(defaultNormalized);
  }

  return result.length > 0 ? result : [SDK_CONFIG_DEFAULT_CHAT_LOCALE];
}
