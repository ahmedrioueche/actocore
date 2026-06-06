import { useTranslation } from 'react-i18next';
import {
  STUDIO_ONBOARDING_STEPS,
  type StudioOnboardingCurrentStep,
  type StudioOnboardingStep,
} from '@ahmedrioueche/actocore-shared';

import { cn } from '@/utils/helper';

interface OnboardingProgressProps {
  currentStep: StudioOnboardingCurrentStep;
}

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const { t } = useTranslation();
  const totalSteps = STUDIO_ONBOARDING_STEPS.length;
  const activeIndex =
    currentStep === 'done'
      ? totalSteps
      : STUDIO_ONBOARDING_STEPS.indexOf(currentStep as StudioOnboardingStep);

  return (
    <nav aria-label={t('onboarding.progressLabel')} className="space-y-2.5">
      <p className="text-xs font-medium tabular-nums text-text-secondary">
        {t('onboarding.stepCounter', {
          current: Math.min(activeIndex + 1, totalSteps),
          total: totalSteps,
        })}
      </p>

      <ol className="flex gap-1.5">
        {STUDIO_ONBOARDING_STEPS.map((step, index) => {
          const filled = index < activeIndex;
          const active = index === activeIndex;

          return (
            <li key={step} className="flex-1">
              <div
                className={cn(
                  'h-1 rounded-full transition-colors duration-300',
                  filled && 'bg-primary',
                  active && 'bg-brand-gradient',
                  !filled && !active && 'bg-border',
                )}
                aria-current={active ? 'step' : undefined}
              >
                <span className="sr-only">{t(`onboarding.steps.${step}`)}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
