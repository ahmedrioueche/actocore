import { createPortal } from 'react-dom';
import { useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { StudioProductTourStep } from '@ahmedrioueche/actocore-shared';
import { Info } from 'lucide-react';

import Button from '@/components/ui/Button';

type CoachmarkProps = {
  step: StudioProductTourStep;
  anchor: HTMLElement;
  anchorVersion: number;
  isLastStep: boolean;
  isPending: boolean;
  onNext: () => void;
  onDismiss: () => void;
};

type Position = {
  top: number;
  left: number;
  placement: 'bottom' | 'top';
};

function computePosition(anchor: HTMLElement): Position {
  const rect = anchor.getBoundingClientRect();
  const cardWidth = 320;
  const margin = 12;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = rect.left;
  if (left + cardWidth > viewportWidth - margin) {
    left = viewportWidth - cardWidth - margin;
  }
  left = Math.max(margin, left);

  const spaceBelow = viewportHeight - rect.bottom;
  const placement: Position['placement'] =
    spaceBelow >= 180 ? 'bottom' : 'top';

  const top =
    placement === 'bottom'
      ? rect.bottom + margin
      : Math.max(margin, rect.top - margin - 160);

  return { top, left, placement };
}

export function Coachmark({
  step,
  anchor,
  anchorVersion,
  isLastStep,
  isPending,
  onNext,
  onDismiss,
}: CoachmarkProps) {
  const { t } = useTranslation();
  const [position, setPosition] = useState<Position>(() =>
    computePosition(anchor),
  );

  useLayoutEffect(() => {
    const update = () => setPosition(computePosition(anchor));
    update();

    const scroller = document.getElementById('studio-content-scroller');
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    scroller?.addEventListener('scroll', update);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      scroller?.removeEventListener('scroll', update);
    };
  }, [anchor, anchorVersion]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <>
      <div
        className="pointer-events-none fixed inset-0 z-[44] bg-black/20"
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby={`product-tour-title-${step}`}
        className="fixed z-[46] w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-border bg-surface p-4 shadow-lg"
        style={{ top: position.top, left: position.left }}
      >
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 space-y-3">
            <div>
              <p
                id={`product-tour-title-${step}`}
                className="font-medium text-text-primary"
              >
                {t(`productTour.steps.${step}.title`)}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {t(`productTour.steps.${step}.body`)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={onNext} loading={isPending}>
                {isLastStep ? t('productTour.done') : t('productTour.next')}
              </Button>
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                {t('productTour.skip')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
