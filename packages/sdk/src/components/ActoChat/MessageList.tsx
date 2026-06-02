import { useEffect, useRef } from 'react';
import type { UiChatMessage } from '../../hooks/use-actocore-chat';
import { useActocoreUiConfig } from '../../context/actocore-context';
import { mergeClassNames } from '../../utils/merge-class-names';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

export function MessageList({
  messages,
  showIntentBadge,
  showSources,
  sessionId,
  isSending,
}: {
  messages: UiChatMessage[];
  showIntentBadge?: boolean;
  showSources?: boolean;
  sessionId: string | undefined;
  isSending?: boolean;
}) {
  const ui = useActocoreUiConfig();
  const typingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSending) return;
    typingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [isSending, messages.length]);

  return (
    <div
      className={mergeClassNames(
        'ac-chat__messages',
        ui.classNames?.messageList,
      )}
    >
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          showIntentBadge={showIntentBadge}
          showSources={showSources}
          sessionId={sessionId}
        />
      ))}
      {isSending ? (
        <div ref={typingRef}>
          <TypingIndicator />
        </div>
      ) : null}
    </div>
  );
}
