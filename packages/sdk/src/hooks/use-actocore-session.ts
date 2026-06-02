import { useCallback, useEffect, useState } from 'react';
import { sessionsApi } from '@ahmedrioueche/actocore-shared';
import type { SessionData, SessionMessageData } from '@ahmedrioueche/actocore-shared';
import type { CreateSessionDto } from '@ahmedrioueche/actocore-shared';
import { useApiErrorMessage } from './use-api-error';

export interface UseActocoreSessionOptions {
  sessionId?: string;
  externalUserId?: string;
  metadata?: Record<string, unknown>;
  loadHistory?: boolean;
}

export interface UseActocoreSessionResult {
  sessionId: string | undefined;
  history: SessionMessageData[];
  isInitializing: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  refreshHistory: () => Promise<void>;
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

export function useActocoreSession(
  options: UseActocoreSessionOptions = {},
): UseActocoreSessionResult {
  const {
    sessionId: initialSessionId,
    loadHistory = true,
    externalUserId,
    metadata,
  } = options;

  const [sessionId, setSessionId] = useState<string | undefined>(
    initialSessionId,
  );
  const [history, setHistory] = useState<SessionMessageData[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formatError = useApiErrorMessage();

  const refreshHistory = useCallback(async () => {
    if (!sessionId) return;
    setIsLoadingHistory(true);
    setError(null);
    try {
      const res = await sessionsApi.listMessages(sessionId);
      if (!res.success) {
        setError(formatError(res));
        return;
      }
      setHistory(res.data ?? []);
    } catch (e) {
      setError(formatError(e));
    } finally {
      setIsLoadingHistory(false);
    }
  }, [formatError, sessionId]);

  const createSession = useCallback(
    async (body?: Partial<CreateSessionDto>) => {
      setIsInitializing(true);
      setError(null);
      try {
        const res = await sessionsApi.create(body ?? {});
        if (!res.success || !res.data) {
          setError(formatError(res));
          throw new Error('Session creation failed');
        }
        setSessionId(res.data.id);
        return res.data.id;
      } catch (e) {
        setError(formatError(e));
        throw e;
      } finally {
        setIsInitializing(false);
      }
    },
    [formatError],
  );

  useEffect(() => {
    let cancelled = false;

    async function ensureSession() {
      setIsInitializing(true);
      setError(null);

      if (initialSessionId) {
        if (!cancelled) {
          setSessionId(initialSessionId);
          setIsInitializing(false);
        }
        return;
      }

      // Already initialized in this hook instance; don't recreate continuously.
      if (sessionId) {
        if (!cancelled) setIsInitializing(false);
        return;
      }

      try {
        const res = await sessionsApi.create(
          pickCreateSessionBody({ externalUserId, metadata }),
        );
        if (!res.success || !res.data) {
          if (!cancelled) setError(formatError(res));
          return;
        }
        if (!cancelled) setSessionId(res.data.id);
      } catch (e) {
        if (!cancelled) setError(formatError(e));
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    }

    void ensureSession();

    return () => {
      cancelled = true;
    };
  }, [externalUserId, formatError, initialSessionId, metadata, sessionId]);

  useEffect(() => {
    if (!loadHistory || !sessionId) {
      return;
    }
    void refreshHistory();
  }, [loadHistory, refreshHistory, sessionId]);

  return {
    sessionId,
    history,
    isInitializing,
    isLoadingHistory,
    error,
    refreshHistory,
    createSession: async (body) => {
      const resolvedBody = {
        ...pickCreateSessionBody({ externalUserId, metadata }),
        ...(body ?? {}),
      };
      return createSession(resolvedBody);
    },
  };
}

