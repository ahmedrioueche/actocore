import type { CSSProperties } from 'react';

const REVEAL_STEP_MS = 55;

/** Matches sticky site header (`SiteHeader` h-20) + scroll-margin on anchor sections. */
export const REVEAL_HEADER_OFFSET_PX = 88;

/** Section top must reach this fraction of the viewport height before revealing. */
export const REVEAL_VIEWPORT_RATIO = 0.72;

/** Stagger delay for `.reveal-item` children inside a `ScrollReveal` with `stagger`. */
export function revealStyle(index: number, stepMs = REVEAL_STEP_MS): CSSProperties {
  return { '--reveal-delay': `${index * stepMs}ms` } as CSSProperties;
}

export function getScrollRoot(node: HTMLElement): Element | null {
  let parent = node.parentElement;

  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return parent;
    }
    parent = parent.parentElement;
  }

  return null;
}

export function getScrollRootHeight(root: Element | null): number {
  if (!root) {
    return window.innerHeight;
  }

  return root.getBoundingClientRect().height;
}

/** IntersectionObserver rootMargin that aligns with the sticky header and reveal line. */
export function revealRootMargin(rootHeight: number): string {
  const topInset = REVEAL_HEADER_OFFSET_PX;
  const bottomInset = Math.max(0, Math.round(rootHeight * (1 - REVEAL_VIEWPORT_RATIO)));
  return `-${topInset}px 0px -${bottomInset}px 0px`;
}

/** True when the trigger point has scrolled into the visible reading band. */
export function shouldReveal(rect: DOMRect, rootHeight: number): boolean {
  const revealLine = rootHeight * REVEAL_VIEWPORT_RATIO;
  return rect.top <= revealLine && rect.bottom > REVEAL_HEADER_OFFSET_PX;
}
