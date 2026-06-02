import type { ResolvedActocoreConfig } from '../config/types';

export function isActionAllowed(
  actionName: string,
  security: ResolvedActocoreConfig['security'],
): boolean {
  const list = security.allowedActionNames;
  if (!list || list.length === 0) {
    return true;
  }
  return list.includes(actionName);
}

export function shouldBlockAction(
  actionName: string,
  security: ResolvedActocoreConfig['security'],
): boolean {
  if (!security.enforceActionAllowlist) {
    return false;
  }
  return !isActionAllowed(actionName, security);
}
