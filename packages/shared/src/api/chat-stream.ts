import { sdkApiPath, BASE_URL, getSdkAuthToken } from '../config/api';
import type { SendChatMessageDto } from '../dtos/chat.dto';
import type { ChatStreamEvent } from '../types/chat';
import { consumeSseBuffer, parseChatStreamEvent } from './sse';

export interface StreamChatMessageOptions {
  signal?: AbortSignal;
  onEvent: (event: ChatStreamEvent) => void;
  apiKey?: string;
  baseURL?: string;
}

function resolveStreamAuth(apiKey?: string): string | null {
  return apiKey?.trim() || getSdkAuthToken();
}

export async function streamChatMessage(
  body: SendChatMessageDto,
  options: StreamChatMessageOptions,
): Promise<void> {
  const base = (options.baseURL ?? BASE_URL()).replace(/\/$/, '');
  const url = `${base}${sdkApiPath('chat/stream')}`;
  const token = resolveStreamAuth(options.apiKey);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: options.signal,
    credentials: 'include',
  });

  if (!response.ok) {
    let message = `Stream request failed (${response.status})`;
    let errorCode = 'INTERNAL_ERROR';
    try {
      const json = (await response.json()) as {
        message?: string;
        errorCode?: string;
      };
      if (json.message) message = json.message;
      if (json.errorCode) errorCode = json.errorCode;
    } catch {
      // ignore
    }
    options.onEvent({ type: 'error', errorCode, message });
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    options.onEvent({
      type: 'error',
      errorCode: 'INTERNAL_ERROR',
      message: 'Streaming body is not available',
    });
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      buffer = consumeSseBuffer(buffer, (raw) => {
        const event = parseChatStreamEvent(raw);
        if (event) {
          options.onEvent(event);
        }
      });
    }

    if (buffer.trim()) {
      consumeSseBuffer(`${buffer}\n`, (raw) => {
        const event = parseChatStreamEvent(raw);
        if (event) {
          options.onEvent(event);
        }
      });
    }
  } catch (error) {
    if (options.signal?.aborted) {
      return;
    }
    const message =
      error instanceof Error ? error.message : 'Stream connection failed';
    options.onEvent({
      type: 'error',
      errorCode: 'INTERNAL_ERROR',
      message,
    });
  } finally {
    reader.releaseLock();
  }
}
