export function getSiteUrl(): string {
  return import.meta.env.VITE_SITE_URL?.trim() || 'http://localhost:3001';
}

export function getStudioUrl(): string {
  return import.meta.env.VITE_STUDIO_URL?.trim() || 'http://localhost:5174';
}

export function playgroundPath(): string {
  return '/playground';
}

export function studioAuthPath(path: 'login' | 'signup'): string {
  const base = getStudioUrl().replace(/\/$/, '');
  return `${base}/${path}`;
}

export type SignupBillingCycle = 'monthly' | 'yearly';

/** Marketing pricing → Studio signup with optional plan pre-selection. */
export function studioSignupPath(options?: {
  planId?: string;
  cycle?: SignupBillingCycle;
}): string {
  const base = getStudioUrl().replace(/\/$/, '');
  const params = new URLSearchParams();
  if (options?.planId) {
    params.set('plan', options.planId);
  }
  if (options?.cycle) {
    params.set('cycle', options.cycle);
  }
  const query = params.toString();
  return `${base}/signup${query ? `?${query}` : ''}`;
}

export const SITE_PATHS = [
  '',
  '/playground',
  '/pricing',
  '/docs',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/security',
  '/compliance',
] as const;
