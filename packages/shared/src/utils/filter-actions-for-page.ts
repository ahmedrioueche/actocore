import type { ActionData } from '../types/action';
import type { AppPageManifestEntry } from '../types/app-page';

export function resolveAppPageIdBySlug(
  slug: string | undefined,
  pages: AppPageManifestEntry[],
): string | undefined {
  if (!slug?.trim() || !pages.length) {
    return undefined;
  }

  return pages.find((page) => page.id === slug.trim())?.pageId;
}

/**
 * Actions explicitly assigned to the current app page (chat picker "This page" scope).
 * Unassigned actions are excluded — use the "All actions" scope for those.
 */
export function filterActionsForPageScope(
  actions: ActionData[],
  currentPageSlug: string | undefined,
  pages: AppPageManifestEntry[],
): ActionData[] {
  const pageId = resolveAppPageIdBySlug(currentPageSlug, pages);
  if (!pageId) {
    return [];
  }

  return actions.filter(
    (action) =>
      !!action.pageIds?.length && action.pageIds.includes(pageId),
  );
}
