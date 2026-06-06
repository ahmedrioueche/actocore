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
    onSessionId,
  } = options;

  const { t } = useTranslation();
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
      setMessages(initialUiMessages);
      setHydratedSessionId(null);
      return;
    }

    if (hydratedSessionId !== sessionId) {
      setMessages(initialUiMessages);
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

  return {
    sessionId,
    messages,
    isInitializing,
    isSending,
    error: null,
    sendMessage,
    clearError: () => undefined,
  };
}
