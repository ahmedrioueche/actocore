import type { CSSProperties, ElementType, ReactNode } from 'react';

import { useRevealOnScroll } from '@/hooks/useRevealOnScroll';
import { cn } from '@/lib/utils';

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  id?: string;
  /** Animate children with `.reveal-item` in sequence instead of the whole block. */
  stagger?: boolean;
};

type RevealOnScrollProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  style?: CSSProperties;
  scale?: boolean;
};

/** Fades content in once when it enters the viewport — one IntersectionObserver per block, then disconnects. */
export function ScrollReveal({
  children,
  className,
  as: Tag = 'div',
  id,
  stagger = false,
}: ScrollRevealProps) {
  const { ref, triggerRef, visible, instant } = useRevealOnScroll();

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
      <span ref={triggerRef} className="scroll-reveal-trigger" aria-hidden />
      {children}
    </Tag>
  );
}

/** Reveals a single block when it scrolls into view — use for staggered card rows instead of one section trigger. */
export function RevealOnScroll({
  children,
  className,
  as: Tag = 'div',
  style,
  scale = false,
}: RevealOnScrollProps) {
  const { ref, triggerRef, visible, instant } = useRevealOnScroll();

  return (
    <Tag
      ref={ref as never}
      className={cn(
        'reveal-item',
        scale && 'reveal-item-scale',
        (visible || instant) && 'is-visible',
        instant && 'is-instant',
        className,
      )}
      style={style}
    >
      <span ref={triggerRef} className="scroll-reveal-trigger" aria-hidden />
      {children}
    </Tag>
  );
}
