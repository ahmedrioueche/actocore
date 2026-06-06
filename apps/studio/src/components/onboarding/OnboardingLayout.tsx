import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';
import { AuthFormPanel } from '@/components/auth/AuthFormPanel';
import { AuthGlassCard } from '@/components/auth/AuthGlassCard';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import type { StudioOnboardingCurrentStep } from '@ahmedrioueche/actocore-shared';
import { cn } from '@/utils/helper';

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
    <div className="auth-shell flex w-full flex-col md:flex-row">
      <AuthBrandPanel variant="signup" />
      <AuthFormPanel align="start" maxWidthClass="max-w-[440px]">
        {onSkip ? (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={onSkip}
              disabled={skipPending}
              className={cn(
                'text-sm font-medium text-text-secondary transition-colors',
                'hover:text-primary',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              {t('onboarding.skip')}
            </button>
          </div>
        ) : null}

        <AuthGlassCard>
          <OnboardingProgress currentStep={currentStep} />
          <div className="mt-7">{children}</div>
        </AuthGlassCard>
      </AuthFormPanel>
    </div>
  );
}

/** Same split shell for loading / error states on the onboarding route. */
export function OnboardingShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell flex w-full flex-col md:flex-row">
      <AuthBrandPanel variant="signup" />
      <AuthFormPanel align="center" maxWidthClass="max-w-[440px]">
        {children}
      </AuthFormPanel>
    </div>
  );
}
