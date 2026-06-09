export interface SessionData {
  id: string;
  externalUserId?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface SessionMessageData {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

/** Cursor page of session messages (newest window or older slice via `before`). */
export interface SessionMessagesPageData {
  items: SessionMessageData[];
  hasMore: boolean;
}
