import { configureApi } from '@ahmedrioueche/actocore-shared';

let configured = false;

export function ensureApiConfigured(): void {
  if (configured) return;
  const baseURL =
    import.meta.env.VITE_ACTOCORE_API_URL?.replace(/\/$/, '') ||
    'http://localhost:3000';
  configureApi({
    baseURL,
    isDev: import.meta.env.DEV,
  });
  configured = true;
}
