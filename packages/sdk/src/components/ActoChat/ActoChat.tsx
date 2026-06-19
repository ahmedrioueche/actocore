import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useActocoreChat, type UiChatMessage } from '../../hooks/use-actocore-chat';
import {
  useActocoreConfig,
  useActocoreContext,
  useActocoreUiConfig,
} from '../../context/actocore-context';
import { mergeClassNames } from '../../utils/merge-class-names';
import { MessageList } from './MessageList';
import { Composer } from './Composer';
import { ChatEmpty } from './ChatEmpty';
import { ChatLoading } from './ChatLoading';
import { ChatHeader } from './ChatHeader';
import { ChatInitProgressBar } from './ChatInitProgressBar';
import { initStyleShowsBar } from '../../utils/resolve-loading-config';

export interface ActoChatProps {
  sessionId?: string;
  externalUserId?: string;
  metadata?: Record<string, unknown>;
  loadHistory?: boolean;
  persistSession?: boolean;
  className?: string;
  /** Custom header/launcher icon — overrides `ui.launcher.iconUrl`. */
  launcherIcon?: ReactNode;
  onMinimize?: () => void;
  /** When false (minimized widget), scroll is deferred until opened. Default true. */
  isOpen?: boolean;
}

export function ActoChat({
  sessionId,
  externalUserId,
  metadata,
  loadHistory,
  persistSession,
  className,
  launcherIcon,
  onMinimize,
  isOpen = true,
}: ActoChatProps) {
  const { t } = useTranslation();
  const { presentationReady } = useActocoreContext();
  const ui = useActocoreUiConfig();
  const config = useActocoreConfig();
  const bodyRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
  const wasInitializingRef = useRef(true);
  const hadMessagesRef = useRef(false);
  const pendingScrollRef = useRef(false);

  const {
    messages,
    sessionId: resolvedSessionId,
    hasMoreHistory,
    isInitializing,
    isSending,
    isStreaming,
    isLoadingMoreHistory,
    sendMessage,
    stopGenerating,
    loadMoreHistory,
    startNewConversation,
    isStartingNewConversation,
  } = useActocoreChat({
    sessionId,
    externalUserId: externalUserId ?? config.externalUserId,
    metadata,
    loadHistory,
    persistSession: persistSession ?? config.persistSession,
  });

  const onSend = useCallback(
    async (content: string) => {
      await sendMessage(content);
    },
    [sendMessage],
  );

  const onLoadMore = useCallback(async () => {
    const body = bodyRef.current;
    const prevScrollHeight = body?.scrollHeight ?? 0;
    const prevScrollTop = body?.scrollTop ?? 0;

    await loadMoreHistory();

    requestAnimationFrame(() => {
      if (!body) return;
      const delta = body.scrollHeight - prevScrollHeight;
      body.scrollTop = prevScrollTop + delta;
    });
  }, [loadMoreHistory]);

  const onStartNewConversation = useCallback(async () => {
    await startNewConversation();
    requestAnimationFrame(() => {
      bodyRef.current?.scrollTo({ top: 0 });
    });
  }, [startNewConversation]);

  const seedMessages = useMemo((): UiChatMessage[] => {
    return (ui.seedMessages ?? []).map((message, index) => ({
      id: `seed-${index}`,
      role: message.role,
      content: message.content,
    }));
  }, [ui.seedMessages]);

  const transcriptMessages = useMemo(
    () => [...seedMessages, ...messages],
    [messages, seedMessages],
  );

  const showEmpty = seedMessages.length === 0 && messages.length === 0;
  const isComposerDisabled =
    isInitializing || !resolvedSessionId || !presentationReady;

  const scrollToLatest = useCallback(() => {
    if (!isOpen) return;

    const body = bodyRef.current;
    if (!body) return;

    const run = () => {
      body.scrollTop = body.scrollHeight;
    };

    run();
    requestAnimationFrame(run);
    requestAnimationFrame(() => requestAnimationFrame(run));
    window.setTimeout(run, 0);
    window.setTimeout(run, 50);
    window.setTimeout(run, 150);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      pendingScrollRef.current = true;
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (wasInitializingRef.current && !isInitializing && transcriptMessages.length > 0) {
      pendingScrollRef.current = true;
    }
    wasInitializingRef.current = isInitializing;
  }, [isInitializing, transcriptMessages.length]);

  useEffect(() => {
    if (!isOpen || isInitializing) return;
    if (transcriptMessages.length > 0 && !hadMessagesRef.current) {
      pendingScrollRef.current = true;
    }
    hadMessagesRef.current = transcriptMessages.length > 0;
  }, [isOpen, isInitializing, transcriptMessages.length]);

  useLayoutEffect(() => {
    if (!pendingScrollRef.current) return;
    if (!isOpen || isInitializing || transcriptMessages.length === 0) return;

    scrollToLatest();
    pendingScrollRef.current = false;
  }, [isOpen, isInitializing, transcriptMessages.length, scrollToLatest]);

  const inlineStyle = useMemo((): CSSProperties | undefined => {
    if (ui.presentation !== 'inline' || !ui.inline) {
      return undefined;
    }
    const style: CSSProperties = {};
    if (ui.inline.maxWidth?.trim()) {
      style.maxWidth = ui.inline.maxWidth.trim();
    }
    if (ui.inline.height?.trim()) {
      style.height = ui.inline.height.trim();
    }
    if (ui.inline.minHeight?.trim()) {
      style.minHeight = ui.inline.minHeight.trim();
    }
    return Object.keys(style).length > 0 ? style : undefined;
  }, [ui.inline, ui.presentation]);

  return (
    <div
      className={mergeClassNames('ac-chat', ui.classNames?.chat, className)}
      style={inlineStyle}
    >
      <ChatHeader
        launcherIcon={launcherIcon}
        onMinimize={onMinimize}
        onNewConversation={onStartNewConversation}
        isNewConversationDisabled={
          isInitializing || isSending || isStartingNewConversation
        }
      />

      {isInitializing && initStyleShowsBar(ui.loading.initStyle) ? (
        <ChatInitProgressBar />
      ) : null}

      <div
        ref={bodyRef}
        className={mergeClassNames('ac-chat__body', 'ac-scrollbar')}
      >
        {isInitializing ? (
          seedMessages.length > 0 ? (
            <>
              <MessageList
                messages={seedMessages}
                showIntentBadge={ui.showIntentBadge}
                showSources={false}
                sessionId={resolvedSessionId}
              />
              <ChatLoading />
            </>
          ) : (
            <ChatLoading />
          )
        ) : (
          <>
            {hasMoreHistory ? (
              <div className="ac-chat__load-more-wrap">
                <button
                  type="button"
                  className="ac-chat__load-more"
                  onClick={() => void onLoadMore()}
                  disabled={isLoadingMoreHistory}
                >
                  {isLoadingMoreHistory
                    ? t('chat.loadingMore')
                    : t('chat.loadMore')}
                </button>
              </div>
            ) : null}
            {showEmpty ? (
              <ChatEmpty />
            ) : (
              <MessageList
                messages={transcriptMessages}
                showIntentBadge={ui.showIntentBadge}
                showSources={ui.showSources}
                sessionId={resolvedSessionId}
                isSending={isSending}
              />
            )}
            <div
              ref={bottomRef}
              className="ac-chat__scroll-anchor"
              aria-hidden
            />
          </>
        )}
      </div>

      <Composer
        onSend={onSend}
        onStop={stopGenerating}
        isSending={isSending}
        isStreaming={isStreaming}
        disabled={isComposerDisabled}
        minRows={ui.composerMinRows}
        maxRows={ui.composerMaxRows}
      />
    </div>
  );
}
