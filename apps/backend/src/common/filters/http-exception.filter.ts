import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  apiError,
  ErrorCode,
  type ApiErrorDetails,
  type PlanLimitErrorDetails,
} from '@ahmedrioueche/actocore-shared';
import type { Response } from 'express';
import { captureSentryException } from '../../observability/sentry.util';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (response.headersSent) {
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'string'
          ? body
          : typeof body === 'object' && body !== null && 'message' in body
            ? this.formatMessage(body.message)
            : exception.message;

      const errorCode =
        typeof body === 'object' &&
        body !== null &&
        'errorCode' in body &&
        typeof body.errorCode === 'string'
          ? (body.errorCode as ErrorCode)
          : this.mapStatusToErrorCode(status);

      if (this.shouldLogHttpException(status, errorCode)) {
        this.logger.warn(`HTTP ${status} ${errorCode}: ${message}`);
      }

      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        captureSentryException(exception, {
          tags: { errorCode, httpStatus: String(status) },
          extra: { message },
        });
      }

      const details = this.extractDetails(body);

      response.status(status).json(apiError(errorCode, message, details));
      return;
    }

    this.logger.error(exception);
    captureSentryException(exception);
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(apiError(ErrorCode.INTERNAL_ERROR, 'Internal server error'));
  }

  private shouldLogHttpException(status: number, errorCode: ErrorCode): boolean {
    if (
      status === HttpStatus.UNAUTHORIZED ||
      status === HttpStatus.FORBIDDEN ||
      status === HttpStatus.CONFLICT
    ) {
      return true;
    }
    return (
      status >= HttpStatus.INTERNAL_SERVER_ERROR ||
      status === HttpStatus.BAD_GATEWAY ||
      status === HttpStatus.GATEWAY_TIMEOUT ||
      status === HttpStatus.TOO_MANY_REQUESTS ||
      errorCode === ErrorCode.BAD_GATEWAY ||
      errorCode === ErrorCode.GATEWAY_TIMEOUT ||
      errorCode === ErrorCode.TOO_MANY_REQUESTS
    );
  }

  private extractDetails(body: unknown): ApiErrorDetails | undefined {
    if (
      typeof body !== 'object' ||
      body === null ||
      !('details' in body) ||
      typeof body.details !== 'object' ||
      body.details === null
    ) {
      return undefined;
    }
    const raw = body.details as Record<string, unknown>;
    if (typeof raw.retryAfterSeconds === 'number') {
      return { retryAfterSeconds: raw.retryAfterSeconds };
    }
    if (typeof raw.limit !== 'number') {
      return undefined;
    }
    const details: PlanLimitErrorDetails = { limit: raw.limit };
    if (typeof raw.used === 'number') {
      details.used = raw.used;
    }
    return details;
  }

  private formatMessage(message: unknown): string {
    if (Array.isArray(message)) {
      return message.join('; ');
    }
    return String(message);
  }

  private mapStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      case HttpStatus.BAD_GATEWAY:
        return ErrorCode.BAD_GATEWAY;
      case HttpStatus.GATEWAY_TIMEOUT:
        return ErrorCode.GATEWAY_TIMEOUT;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.TOO_MANY_REQUESTS;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCode.SERVICE_UNAVAILABLE;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
