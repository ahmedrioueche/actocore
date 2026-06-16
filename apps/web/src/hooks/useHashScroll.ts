import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const HASH_SCROLL_MAX_ATTEMPTS = 40;
const CROSS_ROUTE_CORRECTION_MS = [0, 180, 360] as const;

/** Ensure scroll-reveal blocks are visible when landing on a hash anchor. */
function revealHashTarget(target: HTMLElement) {
  target.classList.add('is-visible');
}

function scrollToHashElement(target: HTMLElement, behavior: ScrollBehavior) {
  revealHashTarget(target);
  target.scrollIntoView({ behavior, block: 'start' });
}

function scrollToHashWhenReady(hash: string, behavior: ScrollBehavior) {
  const id = hash.replace(/^#/, '');
  if (!id) return;

  let attempts = 0;

  const tryScroll = () => {
    const target = document.getElementById(id);
    if (target) {
      scrollToHashElement(target, behavior);
      return true;
    }

    if (attempts++ < HASH_SCROLL_MAX_ATTEMPTS) {
      requestAnimationFrame(tryScroll);
    }
    return false;
  };

  return tryScroll();
}

function scheduleCrossRouteHashCorrection(hash: string) {
  const id = hash.replace(/^#/, '');
  if (!id) return () => undefined;

  const timers = CROSS_ROUTE_CORRECTION_MS.map((delay) =>
    window.setTimeout(() => {
      const target = document.getElementById(id);
      if (!target) return;
      scrollToHashElement(target, 'instant');
    }, delay),
  );

  return () => {
    for (const timer of timers) {
      window.clearTimeout(timer);
    }
  };
}

/**
 * Scroll to in-page anchors after SPA navigation.
 * Cross-route hash links reset to the top first, wait for the target to mount,
 * then jump instantly (same-page hash changes still smooth-scroll).
 */
export function useHashScroll() {
  const { pathname, hash } = useLocation();
  const isInitialMount = useRef(true);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    const pathnameChanged = previousPathname.current !== pathname;
    previousPathname.current = pathname;

    if (isInitialMount.current) {
      isInitialMount.current = false;

      if (hash) {
        scrollToHashWhenReady(hash, 'instant');
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
      return;
    }

    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return;
    }

    if (pathnameChanged) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      scrollToHashWhenReady(hash, 'instant');
      return scheduleCrossRouteHashCorrection(hash);
    }

    scrollToHashWhenReady(hash, 'smooth');
  }, [pathname, hash]);
}
