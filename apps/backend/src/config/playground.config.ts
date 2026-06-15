export interface PlaygroundResolvedConfig {
  enabled: boolean;
  projectTtlDays: number;
  maxBootstrapPerIpPerDay: number;
  sessionSecret: string;
}

export function resolvePlaygroundConfig(): PlaygroundResolvedConfig {
  const enabled = process.env.PLAYGROUND_ENABLED?.trim() === 'true';
  const projectTtlDays = parseInt(
    process.env.PLAYGROUND_PROJECT_TTL_DAYS ?? '7',
    10,
  );
  const maxBootstrapPerIpPerDay = parseInt(
    process.env.PLAYGROUND_MAX_BOOTSTRAP_PER_IP ?? '5',
    10,
  );
  const sessionSecret =
    process.env.PLAYGROUND_SESSION_SECRET?.trim() ||
    process.env.AUTH_API_KEY_PEPPER?.trim() ||
    'dev-playground-secret';

  return {
    enabled,
    projectTtlDays: Number.isFinite(projectTtlDays) ? projectTtlDays : 7,
    maxBootstrapPerIpPerDay: Number.isFinite(maxBootstrapPerIpPerDay)
      ? maxBootstrapPerIpPerDay
      : 5,
    sessionSecret,
  };
}

export const PLAYGROUND_ACCOUNT_ID = 'playground';

export function isPlaygroundAccountId(accountId?: string | null): boolean {
  return accountId === PLAYGROUND_ACCOUNT_ID || accountId === 'legacy';
}
