export const STUDIO_FEATURE_FLAGS = {
  testAccounts: 'testAccounts',
} as const;

export type StudioFeatureFlagId =
  (typeof STUDIO_FEATURE_FLAGS)[keyof typeof STUDIO_FEATURE_FLAGS];

/** Backend env var for each Studio feature flag. */
export const STUDIO_FEATURE_FLAG_ENV_VARS: Record<StudioFeatureFlagId, string> =
  {
    testAccounts: 'STUDIO_FEATURE_TEST_ACCOUNTS',
  };

export function parseBooleanEnvFlag(
  value: string | undefined,
  defaultValue = false,
): boolean {
  if (value === undefined || value.trim() === '') {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }
  if (normalized === 'false') {
    return false;
  }
  return defaultValue;
}

function defaultEnabledInEnv(env: Record<string, string | undefined>): boolean {
  const nodeEnv = env.NODE_ENV ?? 'development';
  return nodeEnv === 'development';
}

export function isStudioFeatureFlagEnabled(
  flag: StudioFeatureFlagId,
  env: Record<string, string | undefined>,
): boolean {
  const envVar = STUDIO_FEATURE_FLAG_ENV_VARS[flag];
  return parseBooleanEnvFlag(env[envVar], defaultEnabledInEnv(env));
}
