import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { QuotaLimits } from '../config/quota.config';
import { RedisService } from '../redis/redis.service';
import { UsageService } from '../usage/usage.service';
import { QuotaExceededException } from './exceptions/quota.exception';

interface MemoryCounter {
  count: number;
  expiresAt: number;
}

@Injectable()
export class QuotaService {
  private readonly memoryCounters = new Map<string, MemoryCounter>();

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly usage: UsageService,
  ) {}

  async consumeChatQuota(projectId: string): Promise<void> {
    const limits = this.config.getOrThrow<QuotaLimits>('quota');
    if (!limits.enabled) {
      return;
    }

    await this.assertMonthlyQuota(projectId, limits.chatPerMonth);
    await this.consumeWindow(
      projectId,
      'minute',
      limits.chatPerMinute,
      60,
      'Per-minute chat quota exceeded',
    );
    await this.consumeWindow(
      projectId,
      'day',
      limits.chatPerDay,
      86_400,
      'Daily chat quota exceeded',
    );
  }

  private async assertMonthlyQuota(
    projectId: string,
    limit: number,
  ): Promise<void> {
    const count = await this.usage.countChatRequestsThisMonth(projectId);
    if (count >= limit) {
      throw new QuotaExceededException('Monthly chat quota exceeded');
    }
  }

  private async consumeWindow(
    projectId: string,
    window: 'minute' | 'day',
    limit: number,
    ttlSeconds: number,
    message: string,
  ): Promise<void> {
    const bucket = this.bucketKey(window);
    const key = `quota:${projectId}:chat:${window}:${bucket}`;
    const count = await this.increment(key, ttlSeconds);

    if (count > limit) {
      throw new QuotaExceededException(message);
    }
  }

  private bucketKey(window: 'minute' | 'day'): string {
    const now = new Date();
    if (window === 'minute') {
      return `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`;
    }
    return `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
  }

  private async increment(key: string, ttlSeconds: number): Promise<number> {
    const client = this.redis.getClient();
    if (client) {
      const count = await client.incr(key);
      if (count === 1) {
        await client.expire(key, ttlSeconds);
      }
      return count;
    }

    return this.incrementMemory(key, ttlSeconds);
  }

  private incrementMemory(key: string, ttlSeconds: number): number {
    const now = Date.now();
    const existing = this.memoryCounters.get(key);

    if (!existing || existing.expiresAt <= now) {
      const entry = { count: 1, expiresAt: now + ttlSeconds * 1000 };
      this.memoryCounters.set(key, entry);
      return 1;
    }

    existing.count += 1;
    return existing.count;
  }
}
