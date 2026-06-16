/** Scrollable ancestor with overflow, or null when the viewport is the scroll root. */
export function getOverflowScrollParent(node: HTMLElement | null): HTMLElement | null {
  let parent = node?.parentElement ?? null;

  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return parent;
    }
    parent = parent.parentElement;
  }

  return null;
}

/** Scroll only inside the nearest overflow parent — never the document. */
export function scrollIntoViewWithinParent(
  element: HTMLElement,
  options?: { behavior?: ScrollBehavior; block?: 'start' | 'end' | 'nearest' },
) {
  const block = options?.block ?? 'nearest';
  const behavior = options?.behavior ?? 'auto';
  const parent = getOverflowScrollParent(element);

  if (!parent) return;

  const elementRect = element.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();
  let nextScrollTop = parent.scrollTop;

  if (block === 'end') {
    if (elementRect.bottom > parentRect.bottom) {
      nextScrollTop += elementRect.bottom - parentRect.bottom;
    }
  } else if (block === 'start') {
    if (elementRect.top < parentRect.top) {
      nextScrollTop -= parentRect.top - elementRect.top;
    }
  } else {
    if (elementRect.bottom > parentRect.bottom) {
      nextScrollTop += elementRect.bottom - parentRect.bottom;
    } else if (elementRect.top < parentRect.top) {
      nextScrollTop -= parentRect.top - elementRect.top;
    }
  }

  if (nextScrollTop !== parent.scrollTop) {
    parent.scrollTo({ top: nextScrollTop, behavior });
  }
}
