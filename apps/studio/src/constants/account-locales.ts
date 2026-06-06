/** Workspace default locale options (SDK / assistant language). */
export const ACCOUNT_LOCALE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ar', label: 'العربية' },
  { value: 'pt', label: 'Português' },
  { value: 'it', label: 'Italiano' },
  { value: 'nl', label: 'Nederlands' },
] as const;

export type AccountLocaleCode = (typeof ACCOUNT_LOCALE_OPTIONS)[number]['value'];

const SUPPORTED = new Set<string>(
  ACCOUNT_LOCALE_OPTIONS.map((option) => option.value),
);

/** Browser language when supported; otherwise empty (user picks explicitly). */
export function resolveBrowserAccountLocale(): string {
  if (typeof navigator === 'undefined') {
    return '';
  }
  const primary = navigator.language?.split('-')[0]?.toLowerCase();
  if (primary && SUPPORTED.has(primary)) {
    return primary;
  }
  return '';
}

export function isAccountLocaleCode(value: string): value is AccountLocaleCode {
  return SUPPORTED.has(value);
}
