import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import type { Request } from 'express';
import type { MarketingChatResolvedConfig } from '../../config/marketing-chat.config';
import { RedisService } from '../../redis/redis.service';
import type { AuthenticatedRequest } from '../../auth/guards/api-key.guard';

type MemoryBucket = { count: number; resetAt: number };

function normalizeOrigin(value: string | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function resolveRequestOrigin(request: Request): string | null {
  const headerOrigin = normalizeOrigin(request.headers.origin);
  if (headerOrigin) {
    return headerOrigin;
  }

  const referer = request.headers.referer;
  if (typeof referer === 'string') {
    return normalizeOrigin(referer);
  }

  return null;
}

@Injectable()
export class MarketingChatGuard implements CanActivate {
  private readonly memory = new Map<string, MemoryBucket>();

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const marketing = this.config.get<MarketingChatResolvedConfig>('marketingChat');
    if (!marketing?.enabled) {
      throw new ServiceUnavailableException({
        errorCode: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Marketing chat is not available.',
      });
    }

    if (!marketing.projectId) {
      throw new ServiceUnavailableException({
        errorCode: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Marketing chat is not configured.',
      });
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const origin = resolveRequestOrigin(request);

    if (!origin || !marketing.allowedOrigins.includes(origin)) {
      throw new ForbiddenException({
        errorCode: ErrorCode.FORBIDDEN,
        message: 'Origin not allowed.',
      });
    }

    await this.enforceRateLimit(request, marketing.rateLimitPerMinute);
    request.marketingProjectId = marketing.projectId;

    return true;
  }

  private async enforceRateLimit(
    request: Request,
    limit: number,
  ): Promise<void> {
    const windowSec = 60;
    const ip = request.ip ?? request.socket?.remoteAddress ?? 'unknown';
    const key = `marketing:ip:${ip}`;
    const { count } = await this.increment(key, windowSec);

    if (count > limit) {
      throw new HttpException(
        {
          errorCode: ErrorCode.TOO_MANY_REQUESTS,
          message: 'Too many requests. Try again shortly.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async increment(
    key: string,
    windowSec: number,
  ): Promise<{ count: number; resetAt: number }> {
    const redisKey = `ratelimit:${key}`;
    const count = await this.redis.incrWithTtl(redisKey, windowSec);
    if (count != null) {
      const ttl = await this.redis.ttlSeconds(redisKey);
      const resetAt = Date.now() + Math.max(ttl ?? windowSec, 1) * 1000;
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
