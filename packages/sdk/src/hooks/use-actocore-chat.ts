import { useCallback, useEffect, useMemo, useState } from 'react';
import { chatApi } from '@ahmedrioueche/actocore-shared';
import type {
  ChatIntent,
  ChatMessageData,
  QaSourceCitation,
  ActionExecutionResult,
  SessionMessageData,
} from '@ahmedrioueche/actocore-shared';
import { useActocoreSession } from './use-actocore-session';
import { useApiErrorMessage } from './use-api-error';

export type UiChatRole = 'user' | 'assistant';

export interface UiChatMessage {
  id: string;
  role: UiChatRole;
  content: string;
  createdAt?: string;
  intent?: ChatIntent;
  action?: ActionExecutionResult;
  sources?: QaSourceCitation[];
}

export interface UseActocoreChatOptions {
  sessionId?: string;
  externalUserId?: string;
  metadata?: Record<string, unknown>;
  loadHistory?: boolean;
  onSessionId?: (sessionId: string) => void;
}

export interface UseActocoreChatResult {
  sessionId: string | undefined;
  messages: UiChatMessage[];
  isInitializing: boolean;
  isSending: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearError: () => void;
}

function asUiMessageFromHistory(msg: SessionMessageData): UiChatMessage | null {
  if (msg.role !== 'user' && msg.role !== 'assistant') return null;
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt,
  };
}

function asUiMessageFromAssistant(assistant: ChatMessageData): UiChatMessage {
  return {
    id: assistant.messageId,
    role: 'assistant',
    content: assistant.content,
    intent: assistant.intent,
    action: assistant.action,
    sources: assistant.sources,
  };
}

export function useActocoreChat(
  options: UseActocoreChatOptions = {},
): UseActocoreChatResult {
  const {
    sessionId: initialSessionId,
    externalUserId,
    metadata,
    loadHistory,
    onSessionId,
  } = options;

  const {
    sessionId,
    history,
    isInitializing,
    error: sessionError,
  } = useActocoreSession({
    sessionId: initialSessionId,
    externalUserId,
    metadata,
    loadHistory,
  });

  const formatError = useApiErrorMessage();
  const [messages, setMessages] = useState<UiChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydratedSessionId, setHydratedSessionId] = useState<string | null>(null);

  useEffect(() => {
    setError(sessionError);
  }, [sessionError]);

  const initialUiMessages = useMemo(() => {
    return history.map(asUiMessageFromHistory).filter(Boolean) as UiChatMessage[];
  }, [history]);

  useEffect(() => {
    if (!sessionId) {
      setMessages(initialUiMessages);
      setHydratedSessionId(null);
      return;
    }

    // Hydrate from backend history once per session to avoid clobbering
    // local optimistic/live conversation state on subsequent re-renders.
    if (hydratedSessionId !== sessionId) {
      setMessages(initialUiMessages);
      setHydratedSessionId(sessionId);
    }
  }, [hydratedSessionId, initialUiMessages, sessionId]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isSending || !sessionId) return;

      setIsSending(true);
      setError(null);

      const optimisticId = `local-${Date.now()}`;
      const optimisticUser: UiChatMessage = {
        id: optimisticId,
        role: 'user',
        content: trimmed,
      };
      setMessages((prev) => [...prev, optimisticUser]);

      try {
        const res = await chatApi.sendMessage({
          message: trimmed,
          sessionId,
        });

        if (!res.success || !res.data) {
          setError(formatError(res));
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
          return;
        }

        const assistant = asUiMessageFromAssistant(res.data);
        // Core always returns sessionId inside ChatMessageData; we treat it as authoritative.
        onSessionId?.(res.data.sessionId);

        setMessages((prev) => [...prev, assistant]);
      } catch (e) {
        setError(formatError(e));
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      } finally {
        setIsSending(false);
      }
    },
    [formatError, isSending, onSessionId, sessionId],
  );

  return {
    sessionId,
    messages,
    isInitializing,
    isSending,
    error,
    sendMessage,
    clearError: () => setError(null),
  };
}

