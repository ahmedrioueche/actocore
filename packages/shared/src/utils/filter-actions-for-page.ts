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
 * Actions for the current page scope: linked to the page plus global actions
 * (actions with no pageIds assignment).
 */
export function filterActionsForPageScope(
  actions: ActionData[],
  currentPageSlug: string | undefined,
  pages: AppPageManifestEntry[],
): ActionData[] {
  const pageId = resolveAppPageIdBySlug(currentPageSlug, pages);

  return actions.filter((action) => {
    if (!action.pageIds?.length) {
      return true;
    }
    if (!pageId) {
      return false;
    }
    return action.pageIds.includes(pageId);
  });
}
