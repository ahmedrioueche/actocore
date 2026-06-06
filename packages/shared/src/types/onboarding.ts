import type {
  StudioOnboardingCurrentStep,
  StudioOnboardingStep,
} from '../constants/studio-onboarding';

export interface StudioOnboardingStateData {
  /** Whether the user must complete onboarding before using the app shell. */
  required: boolean;
  completed: boolean;
  skipped: boolean;
  completedAt?: string;
  currentStep: StudioOnboardingCurrentStep;
  completedSteps: StudioOnboardingStep[];
}
