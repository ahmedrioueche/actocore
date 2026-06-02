export function ChatError({ message }: { message: string | null }) {
  return <div className="ac-chat__error">{message}</div>;
}
