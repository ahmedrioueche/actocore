export class LlmHttpError extends Error {
  constructor(
    readonly status: number,
    readonly responseBody: string,
  ) {
    super(`LLM request failed (${status})`);
    this.name = 'LlmHttpError';
  }
}

export class LlmTimeoutError extends Error {
  constructor() {
    super('LLM request timed out');
    this.name = 'LlmTimeoutError';
  }
}

export class LlmAbortedError extends Error {
  constructor() {
    super('LLM request aborted');
    this.name = 'LlmAbortedError';
  }
}

function consumeSseLines(
  buffer: string,
  onData: (raw: string) => void,
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

export async function postJson<T>(
  url: string,
  options: {
    headers: Record<string, string>;
    body: unknown;
    timeoutMs: number;
  },
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(options.body),
      signal: controller.signal,
    });

    const text = await response.text();
    if (!response.ok) {
      throw new LlmHttpError(response.status, text);
    }

    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new LlmTimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function postJsonStream(
  url: string,
  options: {
    headers: Record<string, string>;
    body: unknown;
    timeoutMs: number;
    signal?: AbortSignal;
    onSseData: (raw: string) => void;
  },
): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  const onExternalAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onExternalAbort);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...options.headers,
      },
      body: JSON.stringify(options.body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new LlmHttpError(response.status, text);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('LLM stream body is not available');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = consumeSseLines(buffer, options.onSseData);
      }

      if (buffer.trim()) {
        consumeSseLines(`${buffer}\n`, options.onSseData);
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    if (options.signal?.aborted) {
      throw new LlmAbortedError();
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new LlmTimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', onExternalAbort);
  }
}
