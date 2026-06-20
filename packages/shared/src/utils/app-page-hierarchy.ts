/** Returns true when assigning parentId would create a cycle for pageId. */
export function wouldCreatePageHierarchyCycle(
  pageId: string,
  parentPageId: string | null | undefined,
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
