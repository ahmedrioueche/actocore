import {
  hasStudioPermission,
  StudioPermission,
  StudioRole,
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
  if (!session) {
    return links.filter((link) => !link.permission);
  }
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

export function canWriteProjects(
  session: StudioAuthMeData | undefined,
): boolean {
  return canAccessNavItem(session, StudioPermission.PROJECT_WRITE);
}

export function isWorkspaceAdmin(
  session: StudioAuthMeData | undefined,
): boolean {
  return (
    session?.role === StudioRole.USER_ADMIN ||
    session?.role === StudioRole.SUPER_ADMIN
  );
}

export function canDeleteProject(
  session: StudioAuthMeData | undefined,
): boolean {
  return isWorkspaceAdmin(session);
}

export function canWriteBilling(
  session: StudioAuthMeData | undefined,
): boolean {
  return canAccessNavItem(session, StudioPermission.BILLING_WRITE);
}

export function canWriteTeam(
  session: StudioAuthMeData | undefined,
): boolean {
  return canAccessNavItem(session, StudioPermission.TEAM_WRITE);
}
