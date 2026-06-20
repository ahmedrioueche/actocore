import type { AppPageData } from '@ahmedrioueche/actocore-shared';
import { DEFAULT_ROOT_PAGE_SLUG } from '@ahmedrioueche/actocore-shared';

export function isContainerPage(page: AppPageData): boolean {
  return page.pageKind === 'container';
}

export function findRootContainerPage(
  pages: AppPageData[] | undefined,
): AppPageData | undefined {
  if (!pages?.length) {
    return undefined;
  }

  return (
    pages.find(
      (page) =>
        page.pageKind === 'container' && page.slug === DEFAULT_ROOT_PAGE_SLUG,
    ) ?? pages.find((page) => page.pageKind === 'container')
  );
}

export function resolveDefaultParentPageId(
  pages: AppPageData[] | undefined,
  explicitParentPageId?: string,
): string | undefined {
  if (explicitParentPageId) {
    return explicitParentPageId;
  }
  return findRootContainerPage(pages)?.id;
}
