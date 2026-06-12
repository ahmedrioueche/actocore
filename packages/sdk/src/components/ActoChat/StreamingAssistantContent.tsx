import { ChatMessageContent } from './ChatMessageContent';

export function StreamingAssistantContent({
  content,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  return (
    <>
      <ChatMessageContent content={content} markdown={false} />
      <span className="ac-chat__stream-cursor" aria-hidden="true" />
    </>
  );
}
