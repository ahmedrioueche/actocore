/** Ordered steps for new workspace admins (user_admin). */
export const STUDIO_ONBOARDING_STEPS = [
  'welcome',
  'workspace',
  'project',
] as const;

export type StudioOnboardingStep = (typeof STUDIO_ONBOARDING_STEPS)[number];

export const STUDIO_ONBOARDING_DONE = 'done' as const;

export type StudioOnboardingCurrentStep =
  | StudioOnboardingStep
  | typeof STUDIO_ONBOARDING_DONE;

export function nextOnboardingStep(
  step: StudioOnboardingStep,
): StudioOnboardingCurrentStep {
  const index = STUDIO_ONBOARDING_STEPS.indexOf(step);
  if (index < 0 || index >= STUDIO_ONBOARDING_STEPS.length - 1) {
    return STUDIO_ONBOARDING_DONE;
  }
  return STUDIO_ONBOARDING_STEPS[index + 1]!;
}

export function resolveOnboardingCurrentStep(
  completedSteps: StudioOnboardingStep[],
  completed: boolean,
  skipped: boolean,
): StudioOnboardingCurrentStep {
  if (completed || skipped) {
    return STUDIO_ONBOARDING_DONE;
  }
  for (const step of STUDIO_ONBOARDING_STEPS) {
    if (!completedSteps.includes(step)) {
      return step;
    }
  }
  return STUDIO_ONBOARDING_DONE;
}
