export const STUDIO_LANGUAGES = {
  en: { label: 'English', dir: 'ltr' as const },
} as const;

export type StudioLanguage = keyof typeof STUDIO_LANGUAGES;

export const STUDIO_LANGUAGE_STORAGE_KEY = 'actocore-studio-language';

export function isStudioLanguage(value: string): value is StudioLanguage {
  return value in STUDIO_LANGUAGES;
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

export function persistStudioLanguage(lang: StudioLanguage): void {
  localStorage.setItem(STUDIO_LANGUAGE_STORAGE_KEY, lang);
  document.documentElement.dir = STUDIO_LANGUAGES[lang].dir;
}
