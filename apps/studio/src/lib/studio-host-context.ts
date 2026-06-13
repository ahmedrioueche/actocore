import type { HostContext } from '@ahmedrioueche/actocore-shared';

/**
 * Route-only host context for the Studio assistant.
 * ActocoreProvider resolves `currentPage` from App Layout entries (slug + route pattern).
 */
export function resolveStudioHostContext(pathname: string): HostContext {
  return { route: pathname };
}
