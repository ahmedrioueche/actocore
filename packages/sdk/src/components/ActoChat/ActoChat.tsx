import { useCallback, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useActocoreChat } from '../../hooks/use-actocore-chat';
import {
  useActocoreConfig,
  useActocoreUiConfig,
} from '../../context/actocore-context';
import { mergeClassNames } from '../../utils/merge-class-names';
import { MessageList } from './MessageList';
import { Composer } from './Composer';
import { ChatEmpty } from './ChatEmpty';
import { ChatLoading } from './ChatLoading';
import { ChatHeader } from './ChatHeader';

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
}: ActoChatProps) {
  const { t } = useTranslation();
  const ui = useActocoreUiConfig();
  const config = useActocoreConfig();
  const bodyRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    sessionId: resolvedSessionId,
    hasMoreHistory,
    isInitializing,
    isSending,
    isLoadingMoreHistory,
    sendMessage,
    loadMoreHistory,
    startNewConversation,
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

  const showEmpty = messages.length === 0;

  return (
    <div className={mergeClassNames('ac-chat', ui.classNames?.chat, className)}>
      <ChatHeader
        launcherIcon={launcherIcon}
        onMinimize={onMinimize}
        onNewConversation={onStartNewConversation}
        isNewConversationDisabled={isInitializing || isSending}
      />

      <div
        ref={bodyRef}
        className={mergeClassNames('ac-chat__body', 'ac-scrollbar')}
      >
        {isInitializing ? (
          <ChatLoading />
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
                messages={messages}
                showIntentBadge={ui.showIntentBadge}
                showSources={ui.showSources}
                sessionId={resolvedSessionId}
                isSending={isSending}
              />
            )}
          </>
        )}
      </div>

      {!isInitializing ? (
        <Composer
          onSend={onSend}
          isSending={isSending}
          minRows={ui.composerMinRows}
          maxRows={ui.composerMaxRows}
        />
      ) : null}
    </div>
  );
}
