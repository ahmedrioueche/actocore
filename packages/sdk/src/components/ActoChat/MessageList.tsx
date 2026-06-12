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
  const streamingRowRef = useRef<HTMLDivElement>(null);
  const streamingMessage = messages.find((m) => m.isStreaming);
  const showTypingIndicator = Boolean(isSending && !streamingMessage);

  useEffect(() => {
    if (!showTypingIndicator) return;
    typingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [showTypingIndicator]);

  const streamScrollRafRef = useRef(0);

  useEffect(() => {
    if (!streamingMessage?.content) return;

    if (streamScrollRafRef.current) {
      cancelAnimationFrame(streamScrollRafRef.current);
    }

    streamScrollRafRef.current = requestAnimationFrame(() => {
      streamScrollRafRef.current = 0;
      streamingRowRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    });

    return () => {
      if (streamScrollRafRef.current) {
        cancelAnimationFrame(streamScrollRafRef.current);
        streamScrollRafRef.current = 0;
      }
    };
  }, [streamingMessage?.content]);

  return (
    <div
      className={mergeClassNames(
        'ac-chat__messages',
        ui.classNames?.messageList,
      )}
    >
      {messages.map((m) => (
        <div
          key={m.id}
          ref={m.isStreaming ? streamingRowRef : undefined}
          data-streaming-active={m.isStreaming ? 'true' : undefined}
        >
          <MessageBubble
            message={m}
            showIntentBadge={showIntentBadge}
            showSources={showSources}
            sessionId={sessionId}
          />
        </div>
      ))}
      {showTypingIndicator ? (
        <div ref={typingRef}>
          <TypingIndicator />
        </div>
      ) : null}
    </div>
  );
}
