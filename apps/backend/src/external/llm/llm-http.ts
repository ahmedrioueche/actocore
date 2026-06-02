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
