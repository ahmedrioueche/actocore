import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from 'react';

import {
  getScrollRoot,
  getScrollRootHeight,
  revealRootMargin,
  shouldReveal,
} from '@/lib/reveal';
import { cn } from '@/lib/utils';

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  id?: string;
  /** Animate children with `.reveal-item` in sequence instead of the whole block. */
  stagger?: boolean;
};

/** Fades content in once when it enters the viewport — one IntersectionObserver per block, then disconnects. */
export function ScrollReveal({
  children,
  className,
  as: Tag = 'div',
  id,
  stagger = false,
}: ScrollRevealProps) {
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

  return (
    <Tag
      ref={ref as never}
      id={id}
      className={cn(
        'scroll-reveal-section',
        stagger && 'scroll-reveal-stagger',
        (visible || instant) && 'is-visible',
        instant && 'is-instant',
        className,
      )}
    >
      <span
        ref={triggerRef}
        className="scroll-reveal-trigger"
        aria-hidden
      />
      {children}
    </Tag>
  );
}
