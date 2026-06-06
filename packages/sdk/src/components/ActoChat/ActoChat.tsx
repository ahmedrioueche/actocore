import { useCallback, type ReactNode } from 'react';
import { useActocoreChat } from '../../hooks/use-actocore-chat';
import { useActocoreUiConfig } from '../../context/actocore-context';
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
  className?: string;
  /** Custom header/launcher icon — overrides `ui.launcher.iconUrl`. */
  launcherIcon?: ReactNode;
}

export function ActoChat({
  sessionId,
  externalUserId,
  metadata,
  loadHistory,
  className,
  launcherIcon,
}: ActoChatProps) {
  const ui = useActocoreUiConfig();

  const {
    messages,
    sessionId: resolvedSessionId,
    isInitializing,
    isSending,
    sendMessage,
  } = useActocoreChat({
    sessionId,
    externalUserId,
    metadata,
    loadHistory,
  });

  const onSend = useCallback(
    async (content: string) => {
      await sendMessage(content);
    },
    [sendMessage],
  );

  const showEmpty = messages.length === 0;

  return (
    <div className={mergeClassNames('ac-chat', ui.classNames?.chat, className)}>
      <ChatHeader launcherIcon={launcherIcon} />

      <div className={mergeClassNames('ac-chat__body', 'ac-scrollbar')}>
        {isInitializing ? (
          <ChatLoading />
        ) : showEmpty ? (
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
