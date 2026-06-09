import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  /** Assistant bubble shown when a request fails instead of blocking the chat UI. */
  isErrorNotice?: boolean;
}

export interface UseActocoreChatOptions {
  sessionId?: string;
  externalUserId?: string;
  metadata?: Record<string, unknown>;
  loadHistory?: boolean;
  persistSession?: boolean;
  onSessionId?: (sessionId: string) => void;
}

export interface UseActocoreChatResult {
  sessionId: string | undefined;
  messages: UiChatMessage[];
  hasMoreHistory: boolean;
  isInitializing: boolean;
  isSending: boolean;
  isLoadingMoreHistory: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  loadMoreHistory: () => Promise<void>;
  startNewConversation: () => Promise<void>;
  clearError: () => void;
}

const SESSION_ERROR_ID = 'session-error';

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

function createAssistantErrorMessage(content: string): UiChatMessage {
  return {
    id: `error-${Date.now()}`,
    role: 'assistant',
    content,
    intent: 'direct',
    isErrorNotice: true,
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
    persistSession,
    onSessionId,
  } = options;

  const { t } = useTranslation();
  const {
    sessionId,
    history,
    hasMoreHistory,
    isInitializing,
    isLoadingHistory,
    isLoadingMoreHistory,
    loadMoreHistory,
    startNewConversation: startNewSession,
    error: sessionError,
  } = useActocoreSession({
    sessionId: initialSessionId,
    externalUserId,
    metadata,
    loadHistory,
    persistSession,
  });

  const formatError = useApiErrorMessage();
  const [messages, setMessages] = useState<UiChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [hydratedSessionId, setHydratedSessionId] = useState<string | null>(null);

  const formatSendFailure = useCallback(
    (error: unknown): string => {
      const formatted = formatError(error);
      const generic = t('errors.generic');
      if (formatted === generic) {
        return t('chat.sendFailed');
      }
      return formatted;
    },
    [formatError, t],
  );

  const initialUiMessages = useMemo(() => {
    return history.map(asUiMessageFromHistory).filter(Boolean) as UiChatMessage[];
  }, [history]);

  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      setHydratedSessionId(null);
      return;
    }

    setMessages((prev) => {
      const inFlight = prev.filter((m) => m.id.startsWith('local-'));
      const notices = prev.filter(
        (m) => m.isErrorNotice || m.id === SESSION_ERROR_ID,
      );
      const liveTail = [...inFlight, ...notices];

      if (inFlight.length > 0) return prev;

      if (hydratedSessionId !== sessionId) {
        return [...initialUiMessages, ...liveTail];
      }

      const historyIds = new Set(initialUiMessages.map((m) => m.id));
      const liveReplies = prev.filter(
        (m) =>
          !historyIds.has(m.id) &&
          !m.id.startsWith('local-') &&
          !m.isErrorNotice &&
          m.id !== SESSION_ERROR_ID,
      );

      return [...initialUiMessages, ...liveReplies, ...liveTail];
    });

    if (hydratedSessionId !== sessionId) {
      setHydratedSessionId(sessionId);
    }
  }, [hydratedSessionId, initialUiMessages, sessionId]);

  useEffect(() => {
    if (!sessionError) {
      setMessages((prev) => prev.filter((m) => m.id !== SESSION_ERROR_ID));
      return;
    }

    const notice = createAssistantErrorMessage(formatSendFailure(sessionError));
    setMessages((prev) => {
      const withoutSessionError = prev.filter((m) => m.id !== SESSION_ERROR_ID);
      return [...withoutSessionError, { ...notice, id: SESSION_ERROR_ID }];
    });
  }, [formatSendFailure, sessionError]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isSending || !sessionId) return;

      setIsSending(true);

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
          setMessages((prev) => [
            ...prev,
            createAssistantErrorMessage(formatSendFailure(res)),
          ]);
          return;
        }

        const assistant = asUiMessageFromAssistant(res.data);
        onSessionId?.(res.data.sessionId);

        setMessages((prev) => [...prev, assistant]);
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          createAssistantErrorMessage(formatSendFailure(e)),
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [formatSendFailure, isSending, onSessionId, sessionId],
  );

  const startNewConversation = useCallback(async () => {
    setMessages([]);
    setHydratedSessionId(null);
    await startNewSession();
  }, [startNewSession]);

  const isBootstrapping =
    isInitializing || (loadHistory !== false && isLoadingHistory);

  return {
    sessionId,
    messages,
    hasMoreHistory,
    isInitializing: isBootstrapping,
    isSending,
    isLoadingMoreHistory,
    error: null,
    sendMessage,
    loadMoreHistory,
    startNewConversation,
    clearError: () => undefined,
  };
}
