import type { ChatStreamEvent } from '../types/chat';

/**
 * Consume complete `data:` lines as soon as a newline arrives (do not wait for `\n\n`).
 * Many providers (Gemini, Nest) flush single-line SSE events.
 */
export function consumeSseBuffer(
  buffer: string,
  onData: (payload: string) => void,
): string {
  let rest = buffer;

  while (true) {
    const newline = rest.indexOf('\n');
    if (newline === -1) break;

    let line = rest.slice(0, newline);
    rest = rest.slice(newline + 1);

    if (line.endsWith('\r')) {
      line = line.slice(0, -1);
    }

    if (!line || line.startsWith(':')) continue;

    if (line.startsWith('data:')) {
      const data = line.slice(5).replace(/^\s+/, '');
      if (data && data !== '[DONE]') {
        onData(data);
      }
    }
  }

  return rest;
}

export function parseSseDataLines(buffer: string): {
  events: string[];
  remainder: string;
} {
  const events: string[] = [];
  const remainder = consumeSseBuffer(buffer, (data) => events.push(data));
  return { events, remainder };
}

export function parseChatStreamEvent(raw: string): ChatStreamEvent | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '[DONE]') return null;

  try {
    const parsed = JSON.parse(trimmed) as ChatStreamEvent;
    if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
