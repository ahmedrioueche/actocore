import {
  ACTOCORE_DEVELOPMENT_API_URL,
  ACTOCORE_PRODUCTION_API_URL,
} from '@ahmedrioueche/actocore-shared';

export function resolveActocoreBaseURL(override?: string): string {
  const trimmed = override?.trim().replace(/\/$/, '');
  if (trimmed) return trimmed;

  const meta = import.meta as ImportMeta & {
    env?: { DEV?: boolean; PROD?: boolean };
  };

  if (meta.env?.DEV) {
    return ACTOCORE_DEVELOPMENT_API_URL;
  }

  if (meta.env?.PROD) {
    return ACTOCORE_PRODUCTION_API_URL;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return ACTOCORE_DEVELOPMENT_API_URL;
    }
  }

  return ACTOCORE_PRODUCTION_API_URL;
}
