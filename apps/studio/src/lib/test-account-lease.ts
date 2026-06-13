import type { StudioTestAccountLeaseData } from '@ahmedrioueche/actocore-shared';

const STORAGE_KEY = 'actocore:studio:test-account-lease';

type StoredTestAccountLease = StudioTestAccountLeaseData & {
  email: string;
};

function readStored(): StoredTestAccountLease | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredTestAccountLease;
    if (
      typeof parsed.email !== 'string' ||
      typeof parsed.leaseId !== 'string' ||
      typeof parsed.expiresAt !== 'string'
    ) {
      return null;
    }
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getStoredTestAccountLeaseHint():
  | { email: string; leaseId: string }
  | null {
  const stored = readStored();
  if (!stored) {
    return null;
  }
  return { email: stored.email, leaseId: stored.leaseId };
}

export function getStoredTestAccountLeaseId(email: string): string | undefined {
  const stored = readStored();
  if (!stored) {
    return undefined;
  }
  if (stored.email !== email.trim().toLowerCase()) {
    return undefined;
  }
  return stored.leaseId;
}

export function persistTestAccountLease(
  email: string,
  lease: StudioTestAccountLeaseData,
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: StoredTestAccountLease = {
    email: email.trim().toLowerCase(),
    leaseId: lease.leaseId,
    expiresAt: lease.expiresAt,
  };
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearTestAccountLease(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.sessionStorage.removeItem(STORAGE_KEY);
}
