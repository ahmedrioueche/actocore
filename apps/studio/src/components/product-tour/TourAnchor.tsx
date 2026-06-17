import { useLayoutEffect, useRef, type ReactNode } from 'react';
import type { StudioProductTourStep } from '@ahmedrioueche/actocore-shared';

import { cn } from '@/utils/helper';

import { useOptionalProductTourContext } from './ProductTourProvider';

type TourAnchorProps = {
  step: StudioProductTourStep;
  children: ReactNode;
  className?: string;
};

export function TourAnchor({ step, children, className }: TourAnchorProps) {
  const tour = useOptionalProductTourContext();
  const ref = useRef<HTMLDivElement>(null);
  const isActive = tour?.isStepActive(step) ?? false;

  useLayoutEffect(() => {
    if (!tour) {
      return;
    }
    tour.registerAnchor(step, ref.current);
    return () => {
      tour.registerAnchor(step, null);
    };
  }, [step, tour]);

  return (
    <div
      ref={ref}
      className={cn(
        className,
        isActive && 'relative z-[45] rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      {children}
    </div>
  );
}
