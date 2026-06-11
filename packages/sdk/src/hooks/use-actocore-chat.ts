import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { chatApi } from '@ahmedrioueche/actocore-shared';
import type {
  ChatIntent,
  ChatMessageData,
  ChatStreamEvent,
  QaSourceCitation,
  ActionExecutionResult,
  SessionMessageData,
} from '@ahmedrioueche/actocore-shared';
import { useActocoreConfig } from '../context/actocore-context';
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
  /** In-flight streamed assistant reply. */
  isStreaming?: boolean;
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
  isStreaming: boolean;
  isLoadingMoreHistory: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  stopGenerating: () => void;
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

function isStreamUnavailableError(event: ChatStreamEvent): boolean {
  if (event.type !== 'error') return false;
  return (
    event.message.includes('(404)') ||
    event.message.includes('(501)') ||
    event.message.includes('(405)')
  );
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

  const config = useActocoreConfig();
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [hydratedSessionId, setHydratedSessionId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const formatSendFailure = useCallback(
    (error: unknown): string => {
      const maybe = error as { errorCode?: string } | null | undefined;
      const errorCode =
        maybe && typeof maybe.errorCode === 'string' ? maybe.errorCode : undefined;

      if (errorCode === 'QUOTA_EXCEEDED') {
        return formatError(error);
      }

      return t('chat.unavailable');
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
      const inFlight = prev.filter(
        (m) => m.id.startsWith('local-') || m.id.startsWith('streaming-'),
      );
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
          !m.id.startsWith('streaming-') &&
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

  const stopGenerating = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const sendJsonMessage = useCallback(
    async (trimmed: string, activeSessionId: string) => {
      const res = await chatApi.sendMessage({
        message: trimmed,
        sessionId: activeSessionId,
      });

      if (!res.success || !res.data) {
        setMessages((prev) => [
          ...prev.filter((m) => !m.isStreaming),
          createAssistantErrorMessage(formatSendFailure(res)),
        ]);
        return;
      }

      const assistant = asUiMessageFromAssistant(res.data);
      onSessionId?.(res.data.sessionId);
      setMessages((prev) => [
        ...prev.filter((m) => !m.isStreaming),
        assistant,
      ]);
    },
    [formatSendFailure, onSessionId],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isSending || !sessionId) return;

      setIsSending(true);

      const optimisticId = `local-${Date.now()}`;
      const streamingId = `streaming-${Date.now()}`;
      const optimisticUser: UiChatMessage = {
        id: optimisticId,
        role: 'user',
        content: trimmed,
      };
      const useStreaming = config.streamResponses;

      setMessages((prev) => [...prev, optimisticUser]);

      if (!useStreaming) {
        try {
          await sendJsonMessage(trimmed, sessionId);
        } catch (e) {
          setMessages((prev) => [
            ...prev,
            createAssistantErrorMessage(formatSendFailure(e)),
          ]);
        } finally {
          setIsSending(false);
          setIsStreaming(false);
        }
        return;
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setIsStreaming(true);

      let streamError: string | null = null;
      let shouldFallback = false;

      try {
        await chatApi.streamMessage(
          { message: trimmed, sessionId },
          {
            signal: abortController.signal,
            onEvent: (event: ChatStreamEvent) => {
              if (event.type === 'meta') {
                onSessionId?.(event.sessionId);
              }

              if (event.type === 'delta' && event.text) {
                setMessages((prev) => {
                  const streaming = prev.find((m) => m.id === streamingId);
                  if (!streaming) {
                    return [
                      ...prev,
                      {
                        id: streamingId,
                        role: 'assistant' as const,
                        content: event.text,
                        isStreaming: true,
                      },
                    ];
                  }
                  return prev.map((m) =>
                    m.id === streamingId
                      ? { ...m, content: m.content + event.text }
                      : m,
                  );
                });
              }

              if (event.type === 'done') {
                const assistant = asUiMessageFromAssistant(event.message);
                onSessionId?.(event.message.sessionId);
                setMessages((prev) =>
                  prev.map((m) => (m.id === streamingId ? assistant : m)),
                );
              }

              if (event.type === 'error') {
                if (isStreamUnavailableError(event)) {
                  shouldFallback = true;
                } else {
                  streamError = formatSendFailure({
                    errorCode: event.errorCode,
                    message: event.message,
                  });
                }
              }
            },
          },
        );

        if (shouldFallback) {
          setMessages((prev) => prev.filter((m) => m.id !== streamingId));
          await sendJsonMessage(trimmed, sessionId);
          return;
        }

        const failedMessage = streamError;
        if (failedMessage != null) {
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== streamingId),
            createAssistantErrorMessage(failedMessage),
          ]);
          return;
        }

        if (abortController.signal.aborted) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingId ? { ...m, isStreaming: false } : m,
            ),
          );
        }
      } catch (e) {
        if (abortController.signal.aborted) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingId ? { ...m, isStreaming: false } : m,
            ),
          );
        } else {
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== streamingId),
            createAssistantErrorMessage(formatSendFailure(e)),
          ]);
        }
      } finally {
        abortControllerRef.current = null;
        setIsSending(false);
        setIsStreaming(false);
      }
    },
    [
      config.streamResponses,
      formatSendFailure,
      isSending,
      onSessionId,
      sendJsonMessage,
      sessionId,
    ],
  );

  const startNewConversation = useCallback(async () => {
    abortControllerRef.current?.abort();
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
    isStreaming,
    isLoadingMoreHistory,
    error: null,
    sendMessage,
    stopGenerating,
    loadMoreHistory,
    startNewConversation,
    clearError: () => undefined,
  };
}
