import type { StudioProductTourStep } from '../constants/studio-product-tour';

export interface StudioProductTourStateData {
  version: number;
  dismissed: boolean;
  completedSteps: StudioProductTourStep[];
  /** False for editors and when signup onboarding was skipped. */
  eligible: boolean;
  /** Next coachmark step, or null when finished / dismissed / ineligible. */
  activeStep: StudioProductTourStep | null;
}
