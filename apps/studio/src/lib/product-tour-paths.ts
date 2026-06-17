import type { StudioProductTourStep } from '@ahmedrioueche/actocore-shared';

export type ProductTourNavigateTarget = {
  to: string;
  params: { projectId: string };
};

/** TanStack Router target for a project-scoped tour step. */
export function getProductTourNavigateTarget(
  projectId: string,
  step: StudioProductTourStep,
): ProductTourNavigateTarget | null {
  switch (step) {
    case 'open_project':
      return null;
    case 'docs':
      return { to: '/projects/$projectId/docs', params: { projectId } };
    case 'api_keys':
      return { to: '/projects/$projectId/api-keys', params: { projectId } };
    case 'knowledge':
      return { to: '/projects/$projectId/knowledge', params: { projectId } };
    case 'actions':
      return { to: '/projects/$projectId/actions', params: { projectId } };
    case 'app_layout':
      return { to: '/projects/$projectId/layout', params: { projectId } };
    case 'sdk_config':
      return { to: '/projects/$projectId/sdk-config', params: { projectId } };
    default:
      return null;
  }
}

/** Returns true when the current pathname completes the given tour step. */
export function isProductTourStepSatisfiedByPath(
  step: StudioProductTourStep,
  pathname: string,
): boolean {
  switch (step) {
    case 'open_project':
      return /^\/projects\/[^/]+/.test(pathname);
    case 'docs':
      return /\/docs(\/|$)/.test(pathname);
    case 'api_keys':
      return /\/api-keys(\/|$)/.test(pathname);
    case 'knowledge':
      return /\/knowledge(\/|$)/.test(pathname);
    case 'actions':
      return /\/actions(\/|$)/.test(pathname);
    case 'app_layout':
      return /\/layout(\/|$)/.test(pathname);
    case 'sdk_config':
      return /\/sdk-config(\/|$)/.test(pathname);
    default:
      return false;
  }
}

export function isProductTourStepVisibleOnPath(
  step: StudioProductTourStep,
  pathname: string,
): boolean {
  if (step === 'open_project') {
    return pathname === '/projects' || pathname === '/projects/';
  }
  return /^\/projects\/[^/]+/.test(pathname);
}
