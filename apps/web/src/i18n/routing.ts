export const routing = {
  locales: ['en', 'fr'] as const,
  defaultLocale: 'en' as const,
};

export type AppLocale = (typeof routing.locales)[number];

export function isAppLocale(value: string | undefined): value is AppLocale {
  return routing.locales.includes(value as AppLocale);
}
