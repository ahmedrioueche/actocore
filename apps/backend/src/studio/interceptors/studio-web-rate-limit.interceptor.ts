import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Response } from 'express';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import type { StudioAuthenticatedRequest } from '../decorators/studio-context.decorator';
import { RedisService } from '../../redis/redis.service';

type MemoryBucket = { count: number; resetAt: number };

@Injectable()
export class StudioWebRateLimitInterceptor implements NestInterceptor {
  private readonly memory = new Map<string, MemoryBucket>();

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const http = context.switchToHttp();
    const req = http.getRequest<StudioAuthenticatedRequest>();
    const res = http.getResponse<Response>();

    const path = req.originalUrl ?? req.url ?? '';
    if (!path.includes('/web/')) {
      return next.handle();
    }

    const limit = this.config.get<number>('http.studioWebRateLimitPerMinute') ?? 120;
    const windowSec = 60;
    const key = this.resolveKey(req);
    const { count, resetAt } = await this.increment(key, windowSec);

    const remaining = Math.max(0, limit - count);
    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.floor(resetAt / 1000)));

    if (count > limit) {
      throw new HttpException(
        {
          errorCode: ErrorCode.TOO_MANY_REQUESTS,
          message: 'Too many requests. Try again shortly.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return next.handle().pipe(
      tap(() => {
        res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - count)));
      }),
    );
  }

  private resolveKey(req: StudioAuthenticatedRequest): string {
    if (req.studio?.accountId) {
      return `web:${req.studio.accountId}`;
    }
    const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
    return `web:ip:${ip}`;
  }

  private async increment(
    key: string,
    windowSec: number,
  ): Promise<{ count: number; resetAt: number }> {
    const client = this.redis.getClient();
    if (client) {
      const redisKey = `ratelimit:${key}`;
      const count = await client.incr(redisKey);
      if (count === 1) {
        await client.expire(redisKey, windowSec);
      }
      const ttl = await client.ttl(redisKey);
      const resetAt = Date.now() + Math.max(ttl, 1) * 1000;
      return { count, resetAt };
    }

    const now = Date.now();
    const bucket = this.memory.get(key);
    if (!bucket || bucket.resetAt <= now) {
      const resetAt = now + windowSec * 1000;
      this.memory.set(key, { count: 1, resetAt });
      return { count: 1, resetAt };
    }
    bucket.count += 1;
    return { count: bucket.count, resetAt: bucket.resetAt };
  }
}
