import ReactMarkdown from 'react-markdown';

export function ChatMessageContent({
  content,
  markdown = false,
}: {
  content: string;
  markdown?: boolean;
}) {
  if (!markdown) {
    return <>{content}</>;
  }

  return (
    <ReactMarkdown
      components={{
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
