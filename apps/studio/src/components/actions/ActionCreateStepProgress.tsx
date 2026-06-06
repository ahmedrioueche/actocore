import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/helper';

interface ActionCreateStepProgressProps {
  step: 1 | 2;
}

export function ActionCreateStepProgress({ step }: ActionCreateStepProgressProps) {
  const { t } = useTranslation();
  const activeIndex = step - 1;

  return (
    <nav
      aria-label={t('projectActions.create.progressLabel')}
      className="space-y-2.5"
    >
      <p className="text-xs font-medium tabular-nums text-text-secondary">
        {t('projectActions.create.stepCounter', { current: step, total: 2 })}
      </p>
      <ol className="flex gap-1.5">
        {[0, 1].map((index) => {
          const filled = index < activeIndex;
          const active = index === activeIndex;
          return (
            <li key={index} className="flex-1">
              <div
                className={cn(
                  'h-1 rounded-full transition-colors duration-300',
                  filled && 'bg-primary',
                  active && 'bg-brand-gradient',
                  !filled && !active && 'bg-border',
                )}
                aria-current={active ? 'step' : undefined}
              />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
