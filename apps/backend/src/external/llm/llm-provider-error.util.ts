import { HttpStatus, Logger } from '@nestjs/common';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { LlmProviderException } from './exceptions/llm-provider.exception';
import { LlmHttpError, LlmTimeoutError } from './llm-http';

const MAX_DETAIL_LENGTH = 400;

/** Parse provider JSON error bodies (Gemini, OpenAI, Anthropic) for logs only. */
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

function clientErrorFromHttpStatus(status: number): {
  status: HttpStatus;
  errorCode: ErrorCode;
} {
  if (status === HttpStatus.REQUEST_TIMEOUT || status === HttpStatus.GATEWAY_TIMEOUT) {
    return {
      status: HttpStatus.GATEWAY_TIMEOUT,
      errorCode: ErrorCode.GATEWAY_TIMEOUT,
    };
  }

  if (
    status === HttpStatus.TOO_MANY_REQUESTS ||
    status === HttpStatus.SERVICE_UNAVAILABLE
  ) {
    return {
      status: HttpStatus.SERVICE_UNAVAILABLE,
      errorCode: ErrorCode.SERVICE_UNAVAILABLE,
    };
  }

  return {
    status: HttpStatus.BAD_GATEWAY,
    errorCode: ErrorCode.BAD_GATEWAY,
  };
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

    const client = clientErrorFromHttpStatus(error.status);
    return new LlmProviderException(
      'Assistant temporarily unavailable',
      client.status,
      client.errorCode,
    );
  }

  if (error instanceof LlmProviderException) {
    return error;
  }

  logger.warn(`${label} request failed`);
  return LlmProviderException.upstream('Assistant temporarily unavailable');
}
