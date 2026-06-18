const STORAGE_KEY = 'actocore:studio:demo-product-tour-seen';

type SeenByEmail = Record<string, true>;

function readSeen(): SeenByEmail {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as SeenByEmail;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeSeen(seen: SeenByEmail): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
}

export function hasSeenDemoProductTour(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return Boolean(readSeen()[normalized]);
}

/** Remember that this browser user finished or skipped the tour for a demo account. */
export function markDemoProductTourSeen(email: string): void {
  const normalized = email.trim().toLowerCase();
  const seen = readSeen();
  if (seen[normalized]) {
    return;
  }
  seen[normalized] = true;
  writeSeen(seen);
}
