import {
  STUDIO_FEATURE_FLAGS,
  type StudioFeatureFlagId,
} from '@ahmedrioueche/actocore-shared';

const VITE_FEATURE_FLAG_ENV_VARS: Record<StudioFeatureFlagId, string> = {
  testAccounts: 'VITE_STUDIO_FEATURE_TEST_ACCOUNTS',
};

function readViteFlag(name: string): boolean {
  const raw = import.meta.env[name]?.trim().toLowerCase();
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }
  return import.meta.env.DEV;
}

export function isStudioFeatureEnabled(flag: StudioFeatureFlagId): boolean {
  const envVar = VITE_FEATURE_FLAG_ENV_VARS[flag];
  return readViteFlag(envVar);
}

export { STUDIO_FEATURE_FLAGS };
