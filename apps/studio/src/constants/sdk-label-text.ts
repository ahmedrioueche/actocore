import {
  SDK_LABEL_FIELD_TO_CHAT_KEY,
  SDK_LABEL_TEXT_FIELDS,
  type SdkLabelTextField,
  type SdkLabelTexts,
  type SdkProjectConfigData,
  type SdkUiTextOverrides,
} from '@ahmedrioueche/actocore-shared';

export {
  SDK_LABEL_FIELD_TO_CHAT_KEY,
  SDK_LABEL_TEXT_FIELDS,
  type SdkLabelTextField,
  type SdkLabelTexts,
};

import { SDK_CONFIG_UI_TEXT_DEFAULTS } from '@/constants/sdk-config-defaults';

const FR_BUNDLED_LABEL_DEFAULTS: SdkLabelTexts = {
  headerTitle: 'Assistant',
  headerSubtitle: 'Posez des questions ou exécutez des actions dans votre app.',
  emptyTitle: '',
  emptyDescription: 'Posez une question ou décrivez ce que vous voulez.',
  actionsHint:
    "Demandez en langage naturel — l'assistant prépare l'action et vous confirmez une fois ; votre app exécute l'interface réelle.",
  placeholder: 'Écrivez un message…',
  send: 'Envoyer',
  stop: 'Arrêter la génération',
  newConversation: 'Nouvelle conversation',
  minimize: 'Réduire le chat',
};

const EN_BUNDLED_LABEL_DEFAULTS: SdkLabelTexts = {
  headerTitle: SDK_CONFIG_UI_TEXT_DEFAULTS.headerTitle,
  headerSubtitle: SDK_CONFIG_UI_TEXT_DEFAULTS.headerSubtitle,
  emptyTitle: SDK_CONFIG_UI_TEXT_DEFAULTS.emptyTitle,
  emptyDescription: SDK_CONFIG_UI_TEXT_DEFAULTS.emptyDescription,
  actionsHint: SDK_CONFIG_UI_TEXT_DEFAULTS.actionsHint,
  placeholder: SDK_CONFIG_UI_TEXT_DEFAULTS.placeholder,
  send: SDK_CONFIG_UI_TEXT_DEFAULTS.send,
  stop: SDK_CONFIG_UI_TEXT_DEFAULTS.stop,
  newConversation: SDK_CONFIG_UI_TEXT_DEFAULTS.newConversation,
  minimize: SDK_CONFIG_UI_TEXT_DEFAULTS.minimize,
};

const BUNDLED_LABEL_DEFAULTS_BY_LOCALE: Record<string, SdkLabelTexts> = {
  en: EN_BUNDLED_LABEL_DEFAULTS,
  fr: FR_BUNDLED_LABEL_DEFAULTS,
};

export const SDK_CHAT_KEY_TO_LABEL_FIELD: Record<string, SdkLabelTextField> =
  Object.fromEntries(
    Object.entries(SDK_LABEL_FIELD_TO_CHAT_KEY).map(([field, key]) => [
      key,
      field as SdkLabelTextField,
    ]),
  ) as Record<string, SdkLabelTextField>;

export function createDefaultLabelTexts(locale: string): SdkLabelTexts {
  const bundled =
    BUNDLED_LABEL_DEFAULTS_BY_LOCALE[locale] ?? EN_BUNDLED_LABEL_DEFAULTS;
  return { ...bundled };
}

export function getBundledLabelDefault(
  field: SdkLabelTextField,
  locale: string,
): string {
  const bundled =
    BUNDLED_LABEL_DEFAULTS_BY_LOCALE[locale] ?? EN_BUNDLED_LABEL_DEFAULTS;
  return bundled[field];
}

export function createEmptyLabelTextsByLocale(
  locales: string[],
): Record<string, SdkLabelTexts> {
  const result: Record<string, SdkLabelTexts> = {};
  for (const locale of locales) {
    result[locale] = createDefaultLabelTexts(locale);
  }
  return result;
}

export function syncLabelTextsByLocale(
  current: Record<string, SdkLabelTexts>,
  supportedLocales: string[],
): Record<string, SdkLabelTexts> {
  const next: Record<string, SdkLabelTexts> = {};

  for (const locale of supportedLocales) {
    next[locale] = current[locale] ?? createDefaultLabelTexts(locale);
  }

  return next;
}

function readChatBundle(
  translations: Record<string, Record<string, unknown>> | undefined,
  locale: string,
): Record<string, string> | undefined {
  const bundle = translations?.[locale]?.chat;
  if (!bundle || typeof bundle !== 'object') {
    return undefined;
  }
  return bundle as Record<string, string>;
}

function readUiTextField(
  text: SdkUiTextOverrides | undefined,
  field: SdkLabelTextField,
): string | undefined {
  const value = text?.[field];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function readLabelTextsForLocale(
  config: Pick<SdkProjectConfigData, 'i18n' | 'ui'>,
  locale: string,
): SdkLabelTexts {
  const defaults = createDefaultLabelTexts(locale);
  const chat = readChatBundle(config.i18n?.translations, locale);
  const defaultLocale = config.i18n?.locale?.trim() || 'en';
  const useLegacyUiText = locale === defaultLocale;

  const result = { ...defaults };

  for (const field of SDK_LABEL_TEXT_FIELDS) {
    const chatKey = SDK_LABEL_FIELD_TO_CHAT_KEY[field];
    const fromTranslations = chat?.[chatKey]?.trim();
    if (fromTranslations) {
      result[field] = fromTranslations;
      continue;
    }

    if (useLegacyUiText) {
      const fromUiText = readUiTextField(config.ui?.text, field);
      if (fromUiText) {
        result[field] = fromUiText;
      }
    }
  }

  return result;
}
