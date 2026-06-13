export const StudioRole = {
  SUPER_ADMIN: "super_admin",
  USER_ADMIN: "user_admin",
  USER_EDITOR: "user_editor",
} as const;

export type StudioRole = (typeof StudioRole)[keyof typeof StudioRole];

export const StudioPermission = {
  PROJECT_READ: "project.read",
  PROJECT_WRITE: "project.write",
  KNOWLEDGE_READ: "knowledge.read",
  KNOWLEDGE_WRITE: "knowledge.write",
  KNOWLEDGE_DELETE: "knowledge.delete",
  SDK_CONFIG_READ: "sdk_config.read",
  SDK_CONFIG_WRITE: "sdk_config.write",
  ACTIONS_READ: "actions.read",
  ACTIONS_WRITE: "actions.write",
  API_KEYS_READ: "api_keys.read",
  API_KEYS_WRITE: "api_keys.write",
  USAGE_READ: "usage.read",
  TEAM_WRITE: "team.write",
  BILLING_READ: "billing.read",
  BILLING_WRITE: "billing.write",
} as const;

export type StudioPermission =
  (typeof StudioPermission)[keyof typeof StudioPermission];

/** Default grants when membership.permissions is empty (tenant Studio). */
const TENANT_USER_ADMIN_PERMISSIONS = Object.values(StudioPermission);

export const STUDIO_ROLE_DEFAULT_PERMISSIONS: Record<StudioRole, string[]> = {
  [StudioRole.SUPER_ADMIN]: Object.values(StudioPermission),
  [StudioRole.USER_ADMIN]: TENANT_USER_ADMIN_PERMISSIONS,
  [StudioRole.USER_EDITOR]: [
    StudioPermission.PROJECT_READ,
    StudioPermission.KNOWLEDGE_READ,
    StudioPermission.KNOWLEDGE_WRITE,
    StudioPermission.KNOWLEDGE_DELETE,
    StudioPermission.SDK_CONFIG_READ,
    StudioPermission.ACTIONS_READ,
  ],
};

export function resolveStudioPermissions(
  role: StudioRole,
  overrides?: string[] | null,
): string[] {
  // Workspace owners always receive the full tenant permission set.
  if (role === StudioRole.SUPER_ADMIN || role === StudioRole.USER_ADMIN) {
    return [...STUDIO_ROLE_DEFAULT_PERMISSIONS[role]];
  }
  if (overrides && overrides.length > 0) {
    return [...new Set(overrides)];
  }
  return [...STUDIO_ROLE_DEFAULT_PERMISSIONS[role]];
}

export function hasStudioPermission(
  granted: string[],
  required: string,
): boolean {
  return granted.includes(required);
}
