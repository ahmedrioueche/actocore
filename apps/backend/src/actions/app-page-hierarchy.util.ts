/** Returns true when assigning parentId would create a cycle for pageId. */
export function wouldCreatePageHierarchyCycle(
  pageId: string,
  parentPageId: string,
  parentByPageId: Map<string, string | null | undefined>,
): boolean {
  let current: string | null | undefined = parentPageId;
  while (current) {
    if (current === pageId) {
      return true;
    }
    current = parentByPageId.get(current) ?? null;
  }
  return false;
}

/** Collect all descendant page ids (direct and nested). */
export function collectDescendantPageIds(
  rootPageId: string,
  childrenByParentId: Map<string, string[]>,
): Set<string> {
  const descendants = new Set<string>();
  const queue = [...(childrenByParentId.get(rootPageId) ?? [])];

  while (queue.length > 0) {
    const pageId = queue.shift();
    if (!pageId || descendants.has(pageId)) {
      continue;
    }
    descendants.add(pageId);
    queue.push(...(childrenByParentId.get(pageId) ?? []));
  }

  return descendants;
}
