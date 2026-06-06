import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';
import Logo from '@/components/ui/Logo';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import type { StudioOnboardingCurrentStep } from '@ahmedrioueche/actocore-shared';

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: StudioOnboardingCurrentStep;
  onSkip?: () => void;
  skipPending?: boolean;
}

export function OnboardingLayout({
  children,
  currentStep,
  onSkip,
  skipPending,
}: OnboardingLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      <AuthBrandPanel />
      <div className="flex-1 flex flex-col px-4 py-8 lg:py-12 bg-background">
        <div className="w-full max-w-xl mx-auto flex flex-col flex-1 gap-8">
          <div className="flex items-center justify-between gap-4">
            <Logo />
            {onSkip ? (
              <button
                type="button"
                onClick={onSkip}
                disabled={skipPending}
                className="text-sm text-text-secondary hover:text-text-primary disabled:opacity-50"
              >
                {t('onboarding.skip')}
              </button>
            ) : null}
          </div>

          <OnboardingProgress currentStep={currentStep} />

          <div className="flex-1 flex flex-col justify-center">{children}</div>
        </div>
      </div>
    </div>
  );
}
