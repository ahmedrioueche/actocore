import { PlatformPermission } from "@ahmedrioueche/actocore-shared";
import {
  Activity,
  BarChart3,
  Building2,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
  MessageSquareWarning,
} from "lucide-react";

import type { StudioNavLink } from "./navigation";

export const ADMIN_NAV_LINKS: StudioNavLink[] = [
  {
    path: "/admin",
    labelKey: "admin.nav.dashboard",
    icon: LayoutDashboard,
    matchPaths: ["/admin"],
    exact: true,
    permission: PlatformPermission.ANALYTICS_READ,
  },
  {
    path: "/admin/usage",
    labelKey: "admin.nav.usage",
    icon: Activity,
    matchPaths: ["/admin/usage"],
    permission: PlatformPermission.ANALYTICS_READ,
  },
  {
    path: "/admin/subscriptions",
    labelKey: "admin.nav.subscriptions",
    icon: CreditCard,
    matchPaths: ["/admin/subscriptions"],
    permission: PlatformPermission.SUBSCRIPTIONS_READ,
  },
  {
    path: "/admin/plans",
    labelKey: "admin.nav.plans",
    icon: CreditCard,
    matchPaths: ["/admin/plans"],
    permission: PlatformPermission.PLANS_WRITE,
  },
  {
    path: "/admin/accounts",
    labelKey: "admin.nav.accounts",
    icon: Building2,
    matchPaths: ["/admin/accounts"],
    permission: PlatformPermission.ACCOUNTS_READ,
  },

  {
    path: "/admin/users",
    labelKey: "admin.nav.users",
    icon: Users,
    matchPaths: ["/admin/users"],
    permission: PlatformPermission.USERS_READ,
  },
  {
    path: "/admin/reports",
    labelKey: "admin.nav.reports",
    icon: MessageSquareWarning,
    matchPaths: ["/admin/reports"],
    permission: PlatformPermission.REPORTS_READ,
  },
  {
    path: "/admin/projects",
    labelKey: "admin.nav.projects",
    icon: FolderKanban,
    matchPaths: ["/admin/projects"],
    permission: PlatformPermission.PROJECTS_READ,
  },
  {
    path: "/admin/analytics",
    labelKey: "admin.nav.analytics",
    icon: BarChart3,
    matchPaths: ["/admin/analytics"],
    permission: PlatformPermission.ANALYTICS_READ,
  },

  {
    path: "/admin/team",
    labelKey: "admin.nav.team",
    icon: Shield,
    matchPaths: ["/admin/team"],
    permission: PlatformPermission.TEAM_WRITE,
  },
  {
    path: "/admin/settings",
    labelKey: "admin.nav.settings",
    icon: Settings,
    matchPaths: ["/admin/settings"],
    permission: PlatformPermission.SETTINGS_WRITE,
  },
];
