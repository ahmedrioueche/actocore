export interface PersistedSessionScope {
  apiKey: string;
  baseURL?: string;
  externalUserId?: string;
}

function fingerprint(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

/** Scoped localStorage key — never stores the raw API key. */
export function buildPersistedSessionStorageKey(
  scope: PersistedSessionScope,
): string {
  const material = [
    scope.apiKey,
    scope.baseURL ?? '',
    scope.externalUserId ?? '',
  ].join('\0');
  return `actocore.session.${fingerprint(material)}`;
}

function storage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readPersistedSessionId(
  scope: PersistedSessionScope,
): string | null {
  const store = storage();
  if (!store) return null;
  const key = buildPersistedSessionStorageKey(scope);
  const value = store.getItem(key)?.trim();
  return value || null;
}

export function writePersistedSessionId(
  scope: PersistedSessionScope,
  sessionId: string,
): void {
  const store = storage();
  if (!store) return;
  const trimmed = sessionId.trim();
  if (!trimmed) return;
  store.setItem(buildPersistedSessionStorageKey(scope), trimmed);
}

export function clearPersistedSessionId(scope: PersistedSessionScope): void {
  const store = storage();
  if (!store) return;
  store.removeItem(buildPersistedSessionStorageKey(scope));
}
