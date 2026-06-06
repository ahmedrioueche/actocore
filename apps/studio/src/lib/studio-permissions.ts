import {
  hasStudioPermission,
  StudioPermission,
  type StudioAuthMeData,
} from "@ahmedrioueche/actocore-shared";

import type { StudioNavLink } from "@/constants/navigation";

export function canAccessNavItem(
  session: StudioAuthMeData | undefined,
  permission?: string,
): boolean {
  if (!permission) {
    return true;
  }
  if (!session) {
    return false;
  }
  return hasStudioPermission(session.permissions, permission);
}

export function filterNavLinks(
  session: StudioAuthMeData | undefined,
  links: StudioNavLink[],
): StudioNavLink[] {
  return links.filter((link) => canAccessNavItem(session, link.permission));
}

export function canWriteApiKeys(
  session: StudioAuthMeData | undefined,
): boolean {
  return canAccessNavItem(session, StudioPermission.API_KEYS_WRITE);
}

export function canWriteKnowledge(
  session: StudioAuthMeData | undefined,
): boolean {
  return canAccessNavItem(session, StudioPermission.KNOWLEDGE_WRITE);
}

export function canDeleteKnowledge(
  session: StudioAuthMeData | undefined,
): boolean {
  return canAccessNavItem(session, StudioPermission.KNOWLEDGE_DELETE);
}

export function canWriteActions(
  session: StudioAuthMeData | undefined,
): boolean {
  return canAccessNavItem(session, StudioPermission.ACTIONS_WRITE);
}

export function canWriteSdkConfig(
  session: StudioAuthMeData | undefined,
): boolean {
  return canAccessNavItem(session, StudioPermission.SDK_CONFIG_WRITE);
}
