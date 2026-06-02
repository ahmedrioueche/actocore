import { Logger } from '@nestjs/common';
import { LlmProviderException } from './exceptions/llm-provider.exception';
import { LlmHttpError, LlmTimeoutError } from './llm-http';

const MAX_DETAIL_LENGTH = 400;

/** Parse provider JSON error bodies (Gemini, OpenAI, Anthropic) for logs and API messages. */
export function summarizeLlmErrorBody(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const json = JSON.parse(trimmed) as {
      error?: { message?: string; status?: string };
      message?: string;
    };
    const message = json.error?.message ?? json.message ?? json.error?.status;
    if (message) {
      return String(message).slice(0, MAX_DETAIL_LENGTH);
    }
  } catch {
    // fall through to raw snippet
  }

  return trimmed.slice(0, MAX_DETAIL_LENGTH);
}

export function mapLlmProviderError(
  label: string,
  error: unknown,
  logger: Logger,
): LlmProviderException {
  if (error instanceof LlmTimeoutError) {
    logger.warn(`${label} request timed out`);
    return LlmProviderException.timeout();
  }

  if (error instanceof LlmHttpError) {
    const detail = summarizeLlmErrorBody(error.responseBody);
    const logMessage = detail
      ? `${label} API error (${error.status}): ${detail}`
      : `${label} API error (${error.status})`;
    logger.warn(logMessage);

    const clientMessage = detail
      ? `${label} API error (${error.status}): ${detail}`
      : `${label} API error (${error.status})`;
    return LlmProviderException.upstream(clientMessage);
  }

  if (error instanceof LlmProviderException) {
    return error;
  }

  logger.warn(`${label} request failed`);
  return LlmProviderException.upstream(`${label} request failed`);
}
