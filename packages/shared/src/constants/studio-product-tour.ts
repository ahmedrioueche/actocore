import { StudioPermission } from './studio-permissions';

/** Ordered in-app coachmark steps after signup onboarding. */
export const STUDIO_PRODUCT_TOUR_STEPS = [
  'open_project',
  'docs',
  'api_keys',
  'knowledge',
  'actions',
  'app_layout',
  'sdk_config',
] as const;

export type StudioProductTourStep = (typeof STUDIO_PRODUCT_TOUR_STEPS)[number];

export const STUDIO_PRODUCT_TOUR_VERSION = 1;

/** Minimum permission required to show each tour step. */
export const STUDIO_PRODUCT_TOUR_STEP_PERMISSIONS: Record<
  StudioProductTourStep,
  string
> = {
  open_project: StudioPermission.PROJECT_READ,
  docs: StudioPermission.PROJECT_READ,
  api_keys: StudioPermission.API_KEYS_READ,
  knowledge: StudioPermission.KNOWLEDGE_READ,
  actions: StudioPermission.ACTIONS_READ,
  app_layout: StudioPermission.ACTIONS_READ,
  sdk_config: StudioPermission.SDK_CONFIG_READ,
};

export function isStudioProductTourStep(
  value: string,
): value is StudioProductTourStep {
  return (STUDIO_PRODUCT_TOUR_STEPS as readonly string[]).includes(value);
}

export function canAccessProductTourStep(
  step: StudioProductTourStep,
  permissions: string[],
): boolean {
  const required = STUDIO_PRODUCT_TOUR_STEP_PERMISSIONS[step];
  return permissions.includes(required);
}

export function getAccessibleProductTourSteps(
  permissions: string[],
): StudioProductTourStep[] {
  return STUDIO_PRODUCT_TOUR_STEPS.filter((step) =>
    canAccessProductTourStep(step, permissions),
  );
}

export function resolveProductTourActiveStep(
  completedSteps: StudioProductTourStep[],
  permissions: string[],
  dismissed: boolean,
  eligible: boolean,
): StudioProductTourStep | null {
  if (!eligible || dismissed) {
    return null;
  }

  const completed = new Set(completedSteps);
  for (const step of STUDIO_PRODUCT_TOUR_STEPS) {
    if (completed.has(step)) {
      continue;
    }
    if (!canAccessProductTourStep(step, permissions)) {
      continue;
    }
    return step;
  }

  return null;
}

export function getProductTourStepsToAutoComplete(
  completedSteps: StudioProductTourStep[],
  permissions: string[],
): StudioProductTourStep[] {
  const completed = new Set(completedSteps);
  return STUDIO_PRODUCT_TOUR_STEPS.filter(
    (step) =>
      !completed.has(step) && !canAccessProductTourStep(step, permissions),
  );
}
