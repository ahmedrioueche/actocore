/** Default form values when creating a child page under a parent. */
export function buildChildPageFormDefaults(parent: {
  slug: string;
  title: string;
  route: string;
}): { slug: string; title: string; route: string } {
  const normalizedRoute = parent.route.replace(/\/+$/, '');

  return {
    slug: `${parent.slug}-`,
    title: parent.title.trim().split(/\s+/)[0] ?? parent.title,
    route: normalizedRoute ? `${normalizedRoute}/` : '/',
  };
}

/** Collect descendant page ids using parentPageId links on page records. */
export function collectDescendantPageIdsFromPages(
  rootPageId: string,
  pages: { id: string; parentPageId?: string | null }[],
): Set<string> {
  const childrenByParent = new Map<string, string[]>();
  for (const page of pages) {
    if (!page.parentPageId) {
      continue;
    }
    const siblings = childrenByParent.get(page.parentPageId) ?? [];
    siblings.push(page.id);
    childrenByParent.set(page.parentPageId, siblings);
  }

  const descendants = new Set<string>();
  const queue = [...(childrenByParent.get(rootPageId) ?? [])];

  while (queue.length > 0) {
    const pageId = queue.shift();
    if (!pageId || descendants.has(pageId)) {
      continue;
    }
    descendants.add(pageId);
    queue.push(...(childrenByParent.get(pageId) ?? []));
  }

  return descendants;
}

export function countDirectChildren(
  pageId: string,
  pages: { id: string; parentPageId?: string | null }[],
): number {
  return pages.filter((page) => page.parentPageId === pageId).length;
}
