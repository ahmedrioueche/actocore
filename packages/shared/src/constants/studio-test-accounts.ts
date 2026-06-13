export const STUDIO_TEST_ACCOUNT_IDS = [
  'demoUser1',
  'demoUser2',
  'demoUser3',
  'demoUser4',
  'demoUser5',
  'demoUser6',
  'demoUser7',
  'demoUser8',
  'demoUser9',
  'demoUser10',
] as const;

export type StudioTestAccountId = (typeof STUDIO_TEST_ACCOUNT_IDS)[number];

export interface StudioTestAccountDefinition {
  id: StudioTestAccountId;
  email: string;
  password: string;
  accountName: string;
  displayName: string;
  /** Default project created on first seed; falls back to platform default name. */
  defaultProjectName?: string;
}

const DEMO_PASSWORD = 'Demo123!';

function buildDemoAccount(
  index: number,
): StudioTestAccountDefinition {
  const id = `demoUser${index}` as StudioTestAccountId;
  return {
    id,
    email: `demo${index}@actocore.test`,
    password: DEMO_PASSWORD,
    accountName: `Demo Workspace ${index}`,
    displayName: `Demo User ${index}`,
    defaultProjectName: 'My first project',
  };
}

/** Known demo credentials — only seeded when Studio test accounts are enabled. */
export const STUDIO_TEST_ACCOUNTS: StudioTestAccountDefinition[] =
  STUDIO_TEST_ACCOUNT_IDS.map((_, index) => buildDemoAccount(index + 1));

/** Max time one visitor may hold a shared demo login without signing out. */
export const STUDIO_TEST_ACCOUNT_LEASE_TTL_SECONDS = 60 * 60;

const TEST_ACCOUNT_EMAILS = new Set(
  STUDIO_TEST_ACCOUNTS.map((account) => account.email.trim().toLowerCase()),
);

export function isStudioTestAccountEmail(email: string): boolean {
  return TEST_ACCOUNT_EMAILS.has(email.trim().toLowerCase());
}

export interface StudioTestAccountLeaseData {
  leaseId: string;
  expiresAt: string;
}

export interface StudioTestAccountLeaseBusyDetails {
  retryAfterSeconds: number;
}

/** Public demo account returned when one is free to use. */
export interface StudioAvailableTestAccountData {
  id: StudioTestAccountId;
  email: string;
  password: string;
  displayName: string;
  accountName: string;
}

export interface StudioAvailableTestAccountResult {
  account: StudioAvailableTestAccountData | null;
  retryAfterSeconds?: number;
}
