import type { AppPageManifestEntry } from '../types/app-page';
import type { HostContext } from '../types/host-context';

/** Normalizes a URL path for route matching (no query, no trailing slash). */
export function normalizeRoutePath(path: string): string {
  const withoutQuery = path.split('?')[0]?.split('#')[0] ?? path;
  if (!withoutQuery || withoutQuery === '/') {
    return '/';
  }
  return withoutQuery.replace(/\/+$/, '') || '/';
}

function routeSegments(path: string): string[] {
  const normalized = normalizeRoutePath(path);
  if (normalized === '/') {
    return [];
  }
  return normalized.slice(1).split('/');
}

/** Returns true when `pathname` matches a Studio route pattern (supports `:param` segments). */
export function matchAppPageRoutePattern(
  pattern: string,
  pathname: string,
): boolean {
  const patternSegs = routeSegments(pattern);
  const pathSegs = routeSegments(pathname);
  if (patternSegs.length !== pathSegs.length) {
    return false;
  }

  for (let i = 0; i < patternSegs.length; i++) {
    const patternSeg = patternSegs[i]!;
    const pathSeg = pathSegs[i]!;
    if (patternSeg.startsWith(':')) {
      if (!pathSeg) {
        return false;
      }
      continue;
    }
    if (patternSeg !== pathSeg) {
      return false;
    }
  }

  return true;
}

function patternSpecificityScore(pattern: string): number {
  const segs = routeSegments(pattern);
  const staticSegments = segs.filter((seg) => !seg.startsWith(':')).length;
  return staticSegments * 1000 + segs.length;
}

/**
 * Finds the best matching app page for a browser path using Studio route patterns.
 * Returns null when no page matches.
 */
export function resolveAppPageFromRoute(
  pathname: string,
  pages: AppPageManifestEntry[],
): AppPageManifestEntry | null {
  if (!pages.length) {
    return null;
  }

  const normalizedPath = normalizeRoutePath(pathname);
  let best: AppPageManifestEntry | null = null;
  let bestScore = -1;

  for (const page of pages) {
    if (!matchAppPageRoutePattern(page.route, normalizedPath)) {
      continue;
    }
    const score = patternSpecificityScore(page.route);
    if (score > bestScore) {
      best = page;
      bestScore = score;
    }
  }

  return best;
}

/**
 * Fills `currentPage` from App Layout when the host sends only `route`.
 * Explicit `currentPage` from the host always wins.
 */
export function enrichHostContext(
  hostContext: HostContext | undefined,
  pages: AppPageManifestEntry[] | undefined,
): HostContext | undefined {
  if (!hostContext) {
    return undefined;
  }

  const route = hostContext.route?.trim();
  if (!route || hostContext.currentPage?.trim() || !pages?.length) {
    return hostContext;
  }

  const match = resolveAppPageFromRoute(route, pages);
  if (!match) {
    return hostContext;
  }

  return {
    ...hostContext,
    currentPage: match.id,
  };
}
