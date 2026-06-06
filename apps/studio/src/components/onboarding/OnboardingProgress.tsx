import { useTranslation } from 'react-i18next';
import {
  STUDIO_ONBOARDING_STEPS,
  type StudioOnboardingCurrentStep,
  type StudioOnboardingStep,
} from '@ahmedrioueche/actocore-shared';

interface OnboardingProgressProps {
  currentStep: StudioOnboardingCurrentStep;
}

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const { t } = useTranslation();
  const activeIndex =
    currentStep === 'done'
      ? STUDIO_ONBOARDING_STEPS.length
      : STUDIO_ONBOARDING_STEPS.indexOf(currentStep as StudioOnboardingStep);

  return (
    <nav aria-label={t('onboarding.progressLabel')} className="w-full">
      <ol className="flex items-center gap-2">
        {STUDIO_ONBOARDING_STEPS.map((step, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <li key={step} className="flex-1 flex flex-col gap-2 min-w-0">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  done || active ? 'bg-primary' : 'bg-border'
                }`}
              />
              <span
                className={`text-xs truncate ${
                  active ? 'text-text-primary font-medium' : 'text-text-secondary'
                }`}
              >
                {t(`onboarding.steps.${step}`)}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
