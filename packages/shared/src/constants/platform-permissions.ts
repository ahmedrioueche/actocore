export const PlatformPermission = {
  ACCOUNTS_READ: 'platform.accounts.read',
  PLANS_WRITE: 'platform.plans.write',
  SUBSCRIPTIONS_READ: 'platform.subscriptions.read',
  USERS_READ: 'platform.users.read',
  PROJECTS_READ: 'platform.projects.read',
  ANALYTICS_READ: 'platform.analytics.read',
  TEAM_WRITE: 'platform.team.write',
  SETTINGS_WRITE: 'platform.settings.write',
  REPORTS_READ: 'platform.reports.read',
  REPORTS_WRITE: 'platform.reports.write',
} as const;

export type PlatformPermission =
  (typeof PlatformPermission)[keyof typeof PlatformPermission];

export const ALL_PLATFORM_PERMISSIONS: PlatformPermission[] = Object.values(
  PlatformPermission,
);

export function hasPlatformPermission(
  granted: string[],
  required: PlatformPermission,
): boolean {
  return granted.includes(required);
}

export function resolvePlatformPermissions(
  isMaster: boolean,
  overrides?: string[] | null,
): PlatformPermission[] {
  if (isMaster) {
    return [...ALL_PLATFORM_PERMISSIONS];
  }
  if (overrides && overrides.length > 0) {
    return overrides.filter((p): p is PlatformPermission =>
      ALL_PLATFORM_PERMISSIONS.includes(p as PlatformPermission),
    );
  }
  return [];
}
