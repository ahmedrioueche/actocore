export const STUDIO_LANGUAGES = {
  en: { label: 'English', dir: 'ltr' as const },
} as const;

export type StudioLanguage = keyof typeof STUDIO_LANGUAGES;
