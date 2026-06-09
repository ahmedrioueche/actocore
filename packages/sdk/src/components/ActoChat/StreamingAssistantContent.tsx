import { useEffect } from 'react';
import { useStreamingReveal } from '../../hooks/use-streaming-reveal';
import { ChatMessageContent } from './ChatMessageContent';

export function StreamingAssistantContent({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming: boolean;
}) {
  const visibleText = useStreamingReveal(content, isStreaming);
  const showCursor = isStreaming;

  useEffect(() => {
    if (!visibleText) return;
    const row = document.querySelector('[data-streaming-active="true"]');
    row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [visibleText]);

  return (
    <>
      <ChatMessageContent content={visibleText} markdown={false} />
      {showCursor ? (
        <span className="ac-chat__stream-cursor" aria-hidden="true" />
      ) : null}
    </>
  );
}
