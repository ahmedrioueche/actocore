import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { AuthenticatedRequest } from '../auth/guards/api-key.guard';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<AuthenticatedRequest>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = http.getResponse<{ statusCode: number }>();
        const durationMs = Date.now() - startedAt;
        const projectId =
          request.actocore?.context?.projectId ?? request.apiKey?.projectId;

        this.logger.log(
          `${request.method} ${request.path} ${response.statusCode} ${durationMs}ms project=${projectId ?? '-'}`,
        );
      }),
    );
  }
}
