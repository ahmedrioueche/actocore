import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const HEADER_OFFSET_PX = 88;

function scrollToHash(hash: string, behavior: ScrollBehavior = 'smooth') {
  const id = hash.replace(/^#/, '');
  if (!id) return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const target = document.getElementById(id);
      if (!target) return;

      const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET_PX;
      window.scrollTo({ top: Math.max(0, top), behavior });
    });
  });
}

/**
 * Scroll to in-page anchors after SPA navigation only.
 * Skips programmatic scroll on first mount when there is no hash (prevents jumping to a
 * restored scroll position or a stale #how-it-works from a prior session).
 */
export function useHashScroll() {
  const { pathname, hash } = useLocation();
  const isInitialMount = useRef(true);

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;

      if (hash) {
        // Direct visit with hash (bookmark) — apply header offset once, no smooth jump
        scrollToHash(hash, 'instant');
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      return;
    }

    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    scrollToHash(hash);
  }, [pathname, hash]);
}
