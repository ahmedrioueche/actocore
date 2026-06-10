import { StudioRole } from '@ahmedrioueche/actocore-shared';

export const TENANT_WORKSPACE_HOME = '/projects';
export const PLATFORM_CONSOLE_HOME = '/admin';

export function isPlatformOperatorRole(
  role: string | undefined,
): role is typeof StudioRole.SUPER_ADMIN {
  return role === StudioRole.SUPER_ADMIN;
}

export function isPlatformOperatorSession(
  session: { role: string } | undefined | null,
): boolean {
  return isPlatformOperatorRole(session?.role);
}
