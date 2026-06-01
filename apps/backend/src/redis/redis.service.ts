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

    this.client.on('error', (err) => {
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
}
