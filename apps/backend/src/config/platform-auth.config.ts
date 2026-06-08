import { getAppEnvironment } from './mongodb.config';

export type PlatformAuthConfig = {
  masterEmail: string | null;
  masterPassword: string | null;
  accountName: string;
};

export function resolvePlatformAuthConfig(): PlatformAuthConfig {
  const nodeEnv = getAppEnvironment();
  const masterEmail =
    process.env.STUDIO_PLATFORM_MASTER_EMAIL?.trim().toLowerCase() || null;
  const masterPassword =
    process.env.STUDIO_PLATFORM_MASTER_PASSWORD?.trim() || null;

  const resolvedEmail =
    masterEmail ||
    (nodeEnv === 'production' ? null : 'platform-master@actocore.local');
  const resolvedPassword =
    masterPassword ||
    (nodeEnv === 'production' ? null : 'dev-platform-master-change-me');

  if (nodeEnv === 'production' && (!resolvedEmail || !resolvedPassword)) {
    throw new Error(
      'STUDIO_PLATFORM_MASTER_EMAIL and STUDIO_PLATFORM_MASTER_PASSWORD are required in production.',
    );
  }

  return {
    masterEmail: resolvedEmail,
    masterPassword: resolvedPassword,
    accountName:
      process.env.STUDIO_PLATFORM_ACCOUNT_NAME?.trim() || 'ActoCore Platform',
  };
}
