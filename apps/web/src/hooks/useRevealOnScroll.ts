import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
  getScrollRoot,
  getScrollRootHeight,
  revealRootMargin,
  shouldReveal,
} from '@/lib/reveal';

/** IntersectionObserver hook — toggles visibility once the trigger enters the reading band. */
export function useRevealOnScroll() {
  const ref = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [instant, setInstant] = useState(false);

  useLayoutEffect(() => {
    const node = ref.current;
    const trigger = triggerRef.current;
    if (!node || !trigger) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInstant(true);
      setVisible(true);
      return;
    }

    const root = getScrollRoot(node);
    const rootHeight = getScrollRootHeight(root);
    if (shouldReveal(trigger.getBoundingClientRect(), rootHeight)) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (visible || instant) return;

    const node = ref.current;
    const trigger = triggerRef.current;
    if (!node || !trigger) return;

    const root = getScrollRoot(node);
    const rootHeight = getScrollRootHeight(root);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        root,
        rootMargin: revealRootMargin(rootHeight),
        threshold: 0,
      },
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [visible, instant]);

  return { ref, triggerRef, visible, instant };
}
