import {
  hasPlatformPermission,
  PlatformPermission,
  type PlatformAuthMeData,
} from '@ahmedrioueche/actocore-shared';

import { ADMIN_NAV_LINKS } from '@/constants/admin-navigation';
import type { StudioNavLink } from '@/constants/navigation';

export function canAccessPlatform(
  session: PlatformAuthMeData | undefined,
  permission: PlatformPermission,
): boolean {
  if (!session) {
    return false;
  }
  if (session.isPlatformMaster) {
    return true;
  }
  return hasPlatformPermission(session.platformPermissions, permission);
}

export function getAccessibleAdminLinks(
  session: PlatformAuthMeData | undefined,
): StudioNavLink[] {
  return ADMIN_NAV_LINKS.filter((link) => {
    if (!link.permission) {
      return true;
    }
    return canAccessPlatform(session, link.permission as PlatformPermission);
  });
}

export function getDefaultAdminPath(
  session: PlatformAuthMeData | undefined,
): string {
  return getAccessibleAdminLinks(session)[0]?.path ?? '/admin/login';
}
