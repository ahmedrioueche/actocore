import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    if (!this.config.get<boolean>('redis.enabled')) {
      return;
    }

    const url = this.config.getOrThrow<string>('redis.url');
    this.client = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });

    this.client.on('error', (err: Error) => {
      this.logger.warn(`Redis error: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.client?.quit();
    this.client = null;
  }

  getClient(): Redis | null {
    return this.client;
  }

  async ping(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      if (this.client.status !== 'ready') {
        await this.client.connect();
      }
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  /** Returns null when Redis is disabled or unreachable (caller should use in-memory fallback). */
  async incrWithTtl(key: string, ttlSeconds: number): Promise<number | null> {
    if (!this.client) {
      return null;
    }

    try {
      if (this.client.status !== 'ready') {
        await this.client.connect();
      }
      const count = await this.client.incr(key);
      if (count === 1) {
        await this.client.expire(key, ttlSeconds);
      }
      return count;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis unavailable (${message}); using in-memory fallback`);
      return null;
    }
  }

  async ttlSeconds(key: string): Promise<number | null> {
    if (!this.client) {
      return null;
    }

    try {
      if (this.client.status !== 'ready') {
        await this.client.connect();
      }
      const ttl = await this.client.ttl(key);
      return ttl;
    } catch {
      return null;
    }
  }
}
