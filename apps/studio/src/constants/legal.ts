/** Legal URLs — override via env when marketing site is live. */
export const LEGAL_LINKS = {
  terms: import.meta.env.VITE_TERMS_URL ?? '#',
  privacy: import.meta.env.VITE_PRIVACY_URL ?? '#',
} as const;
