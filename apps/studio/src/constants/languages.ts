export const STUDIO_LANGUAGES = {
  en: { label: 'English', dir: 'ltr' as const },
  fr: { label: 'Français', dir: 'ltr' as const },
} as const;

export type StudioLanguage = keyof typeof STUDIO_LANGUAGES;

export const STUDIO_LANGUAGE_STORAGE_KEY = 'actocore-studio-language';

export function isStudioLanguage(value: string): value is StudioLanguage {
  return value in STUDIO_LANGUAGES;
}

/** Map workspace defaultLocale to a supported Studio UI language. */
export function accountLocaleToStudioLanguage(
  locale?: string | null,
): StudioLanguage {
  const normalized = locale?.trim().toLowerCase().split('-')[0];
  return normalized === 'fr' ? 'fr' : 'en';
}

export function studioLanguageToAccountLocale(
  lang: StudioLanguage,
): 'en' | 'fr' {
  return lang;
}

export function resolveStoredStudioLanguage(): StudioLanguage {
  if (typeof localStorage === 'undefined') {
    return 'en';
  }
  const stored = localStorage.getItem(STUDIO_LANGUAGE_STORAGE_KEY);
  if (stored && isStudioLanguage(stored)) {
    return stored;
  }
  return 'en';
}

export function applyStudioLanguage(lang: StudioLanguage): void {
  persistStudioLanguage(lang);
}

export function persistStudioLanguage(lang: StudioLanguage): void {
  localStorage.setItem(STUDIO_LANGUAGE_STORAGE_KEY, lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = STUDIO_LANGUAGES[lang].dir;
}
