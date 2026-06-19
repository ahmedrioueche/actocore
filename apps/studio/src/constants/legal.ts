const SUPPORTED_WEB_LOCALES = new Set(['en', 'fr']);

function resolveWebBaseUrl(): string {
  const explicit = import.meta.env.VITE_WEB_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }
  if (import.meta.env.PROD) {
    return 'https://www.actocore.pro';
  }
  return 'http://localhost:3001';
}

function resolveWebLocale(locale?: string): string {
  const normalized = locale?.split('-')[0]?.toLowerCase();
  if (normalized && SUPPORTED_WEB_LOCALES.has(normalized)) {
    return normalized;
  }
  return 'en';
}

function resolveLegalPath(
  page: 'terms' | 'privacy',
  locale?: string,
): string {
  const override =
    page === 'terms'
      ? import.meta.env.VITE_TERMS_URL?.trim()
      : import.meta.env.VITE_PRIVACY_URL?.trim();
  if (override) {
    return override;
  }

  const webLocale = resolveWebLocale(locale);
  return `${resolveWebBaseUrl()}/${webLocale}/${page}`;
}

/** Locale-aware links to marketing site legal pages. */
export function getLegalLinks(locale?: string): {
  terms: string;
  privacy: string;
} {
  return {
    terms: resolveLegalPath('terms', locale),
    privacy: resolveLegalPath('privacy', locale),
  };
}

/** @deprecated Prefer {@link getLegalLinks} for locale-aware URLs. */
export const LEGAL_LINKS = getLegalLinks('en');
