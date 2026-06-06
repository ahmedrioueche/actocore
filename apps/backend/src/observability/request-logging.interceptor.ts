import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import type { AuthenticatedRequest } from '../auth/guards/api-key.guard';
import {
  formatHttpLogLine,
  resolveHttpErrorCode,
  resolveHttpErrorStatus,
} from './http-log.util';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<AuthenticatedRequest>();
    const response = http.getResponse<{ statusCode: number }>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logRequest(request, response.statusCode ?? 200, startedAt);
      }),
      catchError((error: unknown) => {
        this.logRequest(
          request,
          resolveHttpErrorStatus(error),
          startedAt,
          resolveHttpErrorCode(error),
        );
        return throwError(() => error);
      }),
    );
  }

  private logRequest(
    request: AuthenticatedRequest,
    status: number,
    startedAt: number,
    errorCode?: string,
  ): void {
    const projectId =
      request.actocore?.context?.projectId ?? request.apiKey?.projectId;
    const line = formatHttpLogLine({
      method: request.method,
      path: request.path,
      status,
      durationMs: Date.now() - startedAt,
      projectId,
      errorCode,
    });

    if (status >= 500) {
      this.logger.warn(line);
    } else if (status >= 400) {
      this.logger.warn(line);
    } else {
      this.logger.log(line);
    }
  }
}
