import { useCallback, useEffect, useMemo, useState } from 'react';
import { sessionsApi } from '@ahmedrioueche/actocore-shared';
import type { SessionMessageData } from '@ahmedrioueche/actocore-shared';
import type { CreateSessionDto } from '@ahmedrioueche/actocore-shared';
import { useActocoreConfig } from '../context/actocore-context';
import { useApiErrorMessage } from './use-api-error';
import { MESSAGE_HISTORY_PAGE_SIZE } from '../session/message-history';
import {
  clearPersistedSessionId,
  readPersistedSessionId,
  writePersistedSessionId,
  type PersistedSessionScope,
} from '../session/persist-session';

export interface UseActocoreSessionOptions {
  sessionId?: string;
  externalUserId?: string;
  metadata?: Record<string, unknown>;
  loadHistory?: boolean;
  persistSession?: boolean;
  historyPageSize?: number;
}

export interface UseActocoreSessionResult {
  sessionId: string | undefined;
  history: SessionMessageData[];
  hasMoreHistory: boolean;
  isInitializing: boolean;
  isLoadingHistory: boolean;
  isLoadingMoreHistory: boolean;
  error: string | null;
  refreshHistory: () => Promise<void>;
  loadMoreHistory: () => Promise<void>;
  startNewConversation: () => Promise<string>;
  createSession: (body?: Partial<CreateSessionDto>) => Promise<string>;
}

function pickCreateSessionBody(
  opts: Pick<UseActocoreSessionOptions, 'externalUserId' | 'metadata'>,
): Partial<CreateSessionDto> {
  const body: Partial<CreateSessionDto> = {};
  if (opts.externalUserId) body.externalUserId = opts.externalUserId;
  if (opts.metadata) body.metadata = opts.metadata;
  return body;
}

async function fetchMessagePage(
  sessionId: string,
  formatError: (error: unknown) => string,
  options: { limit: number; before?: string },
) {
  const res = await sessionsApi.listMessagePage(sessionId, options);
  if (!res.success || !res.data) {
    throw new Error(formatError(res));
  }
  return res.data;
}

function isSessionGone(error: unknown): boolean {
  const maybe = error as { message?: string; status?: number } | null;
  if (maybe?.status === 404) return true;
  const message = maybe?.message?.toLowerCase() ?? '';
  return message.includes('404') || message.includes('not found');
}

export function useActocoreSession(
  options: UseActocoreSessionOptions = {},
): UseActocoreSessionResult {
  const sdkConfig = useActocoreConfig();
  const {
    sessionId: initialSessionId,
    loadHistory = true,
    externalUserId = sdkConfig.externalUserId,
    metadata,
    persistSession = sdkConfig.persistSession,
    historyPageSize = MESSAGE_HISTORY_PAGE_SIZE,
  } = options;

  const stableMetadata = useMemo(
    () => metadata,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable serialized metadata
    [metadata == null ? null : JSON.stringify(metadata)],
  );

  const persistScope = useMemo<PersistedSessionScope>(
    () => ({
      apiKey: sdkConfig.api.apiKey,
      baseURL: sdkConfig.api.baseURL,
      externalUserId,
    }),
    [externalUserId, sdkConfig.api.apiKey, sdkConfig.api.baseURL],
  );

  const [sessionId, setSessionId] = useState<string | undefined>(
    initialSessionId,
  );
  const [history, setHistory] = useState<SessionMessageData[]>([]);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formatError = useApiErrorMessage();

  const persistSessionId = useCallback(
    (id: string) => {
      if (!persistSession) return;
      writePersistedSessionId(persistScope, id);
    },
    [persistScope, persistSession],
  );

  const loadInitialHistory = useCallback(
    async (id: string) => {
      const page = await fetchMessagePage(id, formatError, {
        limit: historyPageSize,
      });
      return page;
    },
    [formatError, historyPageSize],
  );

  const refreshHistory = useCallback(async () => {
    if (!sessionId) return;
    setIsLoadingHistory(true);
    setError(null);
    try {
      const page = await loadInitialHistory(sessionId);
      setHistory(page.items);
      setHasMoreHistory(page.hasMore);
    } catch (e) {
      setError(formatError(e));
    } finally {
      setIsLoadingHistory(false);
    }
  }, [formatError, loadInitialHistory, sessionId]);

  const loadMoreHistory = useCallback(async () => {
    if (!sessionId || !hasMoreHistory || isLoadingMoreHistory) return;
    const oldest = history[0];
    if (!oldest) return;

    setIsLoadingMoreHistory(true);
    setError(null);
    try {
      const page = await fetchMessagePage(sessionId, formatError, {
        limit: historyPageSize,
        before: oldest.id,
      });
      setHistory((prev) => [...page.items, ...prev]);
      setHasMoreHistory(page.hasMore);
    } catch (e) {
      setError(formatError(e));
    } finally {
      setIsLoadingMoreHistory(false);
    }
  }, [
    formatError,
    hasMoreHistory,
    history,
    historyPageSize,
    isLoadingMoreHistory,
    sessionId,
  ]);

  const createSessionRecord = useCallback(
    async (body?: Partial<CreateSessionDto>) => {
      const res = await sessionsApi.create(body ?? {});
      if (!res.success || !res.data) {
        throw new Error(formatError(res));
      }
      return res.data.id;
    },
    [formatError],
  );

  const createSession = useCallback(
    async (body?: Partial<CreateSessionDto>) => {
      setIsInitializing(true);
      setError(null);
      try {
        const id = await createSessionRecord(body);
        setSessionId(id);
        setHistory([]);
        setHasMoreHistory(false);
        persistSessionId(id);
        return id;
      } catch (e) {
        setError(formatError(e));
        throw e;
      } finally {
        setIsInitializing(false);
      }
    },
    [createSessionRecord, formatError, persistSessionId],
  );

  const startNewConversation = useCallback(async () => {
    setError(null);
    const previousId = sessionId;

    if (previousId) {
      try {
        await sessionsApi.delete(previousId);
      } catch {
        // Best-effort cleanup — still start a fresh session.
      }
      clearPersistedSessionId(persistScope);
    }

    setHistory([]);
    setHasMoreHistory(false);

    const id = await createSessionRecord(
      pickCreateSessionBody({ externalUserId, metadata: stableMetadata }),
    );
    setSessionId(id);
    persistSessionId(id);
    return id;
  }, [
    createSessionRecord,
    externalUserId,
    stableMetadata,
    persistScope,
    persistSessionId,
    sessionId,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function ensureSession() {
      setIsInitializing(true);
      setError(null);
      setHistory([]);
      setHasMoreHistory(false);

      if (initialSessionId) {
        if (!cancelled) {
          setSessionId(initialSessionId);
        }

        let page = { items: [] as SessionMessageData[], hasMore: false };
        if (loadHistory) {
          try {
            page = await loadInitialHistory(initialSessionId);
          } catch (e) {
            if (!cancelled) setError(formatError(e));
          }
        }
        if (!cancelled) {
          setSessionId(initialSessionId);
          setHistory(page.items);
          setHasMoreHistory(page.hasMore);
          setIsInitializing(false);
        }
        return;
      }

      let resolvedId: string | undefined;
      const storedId = persistSession
        ? readPersistedSessionId(persistScope)
        : undefined;

      if (storedId) {
        if (!cancelled) {
          setSessionId(storedId);
        }

        if (loadHistory) {
          try {
            const page = await loadInitialHistory(storedId);
            if (!cancelled) {
              setSessionId(storedId);
              setHistory(page.items);
              setHasMoreHistory(page.hasMore);
              setIsInitializing(false);
            }
            return;
          } catch (e) {
            if (!isSessionGone(e)) {
              if (!cancelled) {
                setError(formatError(e));
                setIsInitializing(false);
              }
              return;
            }
            clearPersistedSessionId(persistScope);
          }
        } else if (!cancelled) {
          setSessionId(storedId);
          setIsInitializing(false);
          return;
        }
      }

      try {
        resolvedId = await createSessionRecord(
          pickCreateSessionBody({ externalUserId, metadata: stableMetadata }),
        );
        if (persistSession && resolvedId) {
          writePersistedSessionId(persistScope, resolvedId);
        }
      } catch (e) {
        if (!cancelled) {
          setError(formatError(e));
          setIsInitializing(false);
        }
        return;
      }

      if (cancelled || !resolvedId) {
        return;
      }

      let page = { items: [] as SessionMessageData[], hasMore: false };
      if (loadHistory) {
        try {
          page = await loadInitialHistory(resolvedId);
        } catch (e) {
          if (!cancelled) setError(formatError(e));
        }
      }

      if (!cancelled) {
        setSessionId(resolvedId);
        setHistory(page.items);
        setHasMoreHistory(page.hasMore);
        setIsInitializing(false);
      }
    }

    void ensureSession();

    return () => {
      cancelled = true;
    };
  }, [
    createSessionRecord,
    externalUserId,
    formatError,
    initialSessionId,
    loadHistory,
    loadInitialHistory,
    stableMetadata,
    persistScope,
    persistSession,
  ]);

  return {
    sessionId,
    history,
    hasMoreHistory,
    isInitializing,
    isLoadingHistory,
    isLoadingMoreHistory,
    error,
    refreshHistory,
    loadMoreHistory,
    startNewConversation,
    createSession: async (body) => {
      const resolvedBody = {
        ...pickCreateSessionBody({ externalUserId, metadata: stableMetadata }),
        ...(body ?? {}),
      };
      return createSession(resolvedBody);
    },
  };
}
