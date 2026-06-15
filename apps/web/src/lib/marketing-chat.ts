const VISITOR_STORAGE_KEY = 'actocore-visitor-id';

function getBaseVisitorId(): string {
  if (typeof window === 'undefined') {
    return 'ssr-visitor';
  }

  const existing = localStorage.getItem(VISITOR_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `visitor-${Date.now()}`;
  localStorage.setItem(VISITOR_STORAGE_KEY, id);
  return id;
}

/** Stable browser visitor id (shared across marketing surfaces). */
export function getHeroVisitorId(): string {
  return getBaseVisitorId();
}

/** Isolated marketing hero chat session — separate from playground. */
export function getHeroChatExternalUserId(): string {
  return `${getBaseVisitorId()}:marketing-hero`;
}

/** Isolated playground chat session — driven by playground panel state. */
export function getPlaygroundChatExternalUserId(): string {
  return `${getBaseVisitorId()}:playground`;
}

export function isMarketingChatEnabled(): boolean {
  if (import.meta.env.VITE_MARKETING_CHAT_ENABLED === 'false') {
    return false;
  }
  return (
    import.meta.env.VITE_MARKETING_CHAT_ENABLED === 'true' || import.meta.env.DEV
  );
}

export function getActocoreApiUrl(): string {
  return (
    import.meta.env.VITE_ACTOCORE_API_URL?.replace(/\/$/, '') ||
    'http://localhost:3000'
  );
}
