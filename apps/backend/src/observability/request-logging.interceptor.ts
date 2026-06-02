import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, finalize, Observable, throwError } from 'rxjs';
import type { AuthenticatedRequest } from '../auth/guards/api-key.guard';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<AuthenticatedRequest>();
    const startedAt = Date.now();

    return next.handle().pipe(
      catchError((error: unknown) => throwError(() => error)),
      finalize(() => {
        const response = http.getResponse<{ statusCode: number }>();
        const durationMs = Date.now() - startedAt;
        const projectId =
          request.actocore?.context?.projectId ?? request.apiKey?.projectId;
        const status = response.statusCode ?? 500;
        const line = `${request.method} ${request.path} ${status} ${durationMs}ms project=${projectId ?? '-'}`;

        if (status >= 500) {
          this.logger.warn(line);
        } else {
          this.logger.log(line);
        }
      }),
    );
  }
}
