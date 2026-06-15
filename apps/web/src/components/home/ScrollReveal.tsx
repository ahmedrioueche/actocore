import { useEffect, useLayoutEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  id?: string;
};

/** Fades content in once when it enters the viewport — one IntersectionObserver per block, then disconnects. */
export function ScrollReveal({
  children,
  className,
  as: Tag = 'div',
  id,
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [instant, setInstant] = useState(false);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInstant(true);
      return;
    }

    const inViewOnLoad = node.getBoundingClientRect().top < window.innerHeight * 0.92;
    if (inViewOnLoad) {
      setInstant(true);
    }
  }, []);

  useEffect(() => {
    if (instant) return;

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: '0px 0px -6% 0px', threshold: 0.1 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [instant]);

  return (
    <Tag
      ref={ref as never}
      id={id}
      className={cn(
        'scroll-reveal-section',
        (visible || instant) && 'is-visible',
        instant && 'is-instant',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
