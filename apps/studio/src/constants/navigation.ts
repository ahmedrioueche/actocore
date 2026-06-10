import type { StudioAuthMeData } from "@ahmedrioueche/actocore-shared";
import { StudioPermission, StudioRole } from "@ahmedrioueche/actocore-shared";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  CreditCard,
  FileText,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  Receipt,
  Settings,
  Settings2,
  SlidersHorizontal,
  Users,
  Zap,
} from "lucide-react";

export interface StudioNavLink {
  path: string;
  labelKey: string;
  icon: LucideIcon;
  matchPaths: string[];
  permission?: string;
  /** When true, active only on exact path match (not sub-routes). */
  exact?: boolean;
}

export const STUDIO_NAV_LINKS: StudioNavLink[] = [
  {
    path: "/projects",
    labelKey: "nav.projects",
    icon: FolderKanban,
    matchPaths: ["/projects"],
    exact: true,
  },

  {
    path: "/usage",
    labelKey: "nav.usage",
    icon: BarChart3,
    matchPaths: ["/usage"],
    permission: StudioPermission.USAGE_READ,
  },
  {
    path: "/subscription",
    labelKey: "nav.subscription",
    icon: CreditCard,
    matchPaths: ["/subscription"],
    permission: StudioPermission.BILLING_READ,
  },
  {
    path: "/billing",
    labelKey: "nav.billing",
    icon: Receipt,
    matchPaths: ["/billing"],
    permission: StudioPermission.BILLING_READ,
  },
  {
    path: "/team",
    labelKey: "nav.team",
    icon: Users,
    matchPaths: ["/team"],
    permission: StudioPermission.TEAM_WRITE,
  },
  {
    path: "/settings",
    labelKey: "nav.settings",
    icon: Settings,
    matchPaths: ["/settings"],
  },
];

export function getProjectNavLinks(projectId: string): StudioNavLink[] {
  const base = `/projects/${projectId}`;

  return [
    {
      path: base,
      labelKey: "nav.project.overview",
      icon: LayoutDashboard,
      matchPaths: [base],
      exact: true,
      permission: StudioPermission.PROJECT_READ,
    },
    {
      path: `${base}/docs`,
      labelKey: "nav.project.docs",
      icon: FileText,
      matchPaths: [`${base}/docs`],
      permission: StudioPermission.PROJECT_READ,
    },
    {
      path: `${base}/api-keys`,
      labelKey: "nav.project.apiKeys",
      icon: KeyRound,
      matchPaths: [`${base}/api-keys`],
      permission: StudioPermission.API_KEYS_READ,
    },
    {
      path: `${base}/knowledge`,
      labelKey: "nav.project.knowledge",
      icon: BookOpen,
      matchPaths: [`${base}/knowledge`],
      permission: StudioPermission.KNOWLEDGE_READ,
    },
    {
      path: `${base}/actions`,
      labelKey: "nav.project.actions",
      icon: Zap,
      matchPaths: [`${base}/actions`],
      permission: StudioPermission.ACTIONS_READ,
    },
    {
      path: `${base}/sdk-config`,
      labelKey: "nav.project.sdkConfig",
      icon: SlidersHorizontal,
      matchPaths: [`${base}/sdk-config`],
      permission: StudioPermission.SDK_CONFIG_READ,
    },
    {
      path: `${base}/usage`,
      labelKey: "nav.project.usage",
      icon: BarChart3,
      matchPaths: [`${base}/usage`],
      permission: StudioPermission.USAGE_READ,
    },
    {
      path: `${base}/settings`,
      labelKey: "nav.project.settings",
      icon: Settings2,
      matchPaths: [`${base}/settings`],
      permission: StudioPermission.PROJECT_READ,
    },
  ];
}

/** Returns project id when pathname is under `/projects/:projectId`. */
export function parseProjectIdFromPath(pathname: string): string | null {
  if (pathname === "/projects" || !pathname.startsWith("/projects/")) {
    return null;
  }
  const segment = pathname.split("/")[2];
  return segment || null;
}

export function canAccessProject(
  session: StudioAuthMeData,
  projectId: string,
): boolean {
  if (
    session.role === StudioRole.SUPER_ADMIN ||
    session.role === StudioRole.USER_ADMIN
  ) {
    return true;
  }
  return session.projectIds.includes(projectId);
}

export function isNavLinkActive(
  pathname: string,
  link: StudioNavLink,
): boolean {
  if (link.exact) {
    return pathname === link.path;
  }
  return link.matchPaths.some((p) => pathname.startsWith(p));
}
