import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import type {
  DependencyStatus,
  HealthCheckData,
  HealthStatus,
} from '@ahmedrioueche/actocore-shared';
import { Connection } from 'mongoose';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  getLive(): { status: 'ok' } {
    return { status: 'ok' };
  }

  async getReady(): Promise<HealthCheckData> {
    const mongo = await this.checkMongo();
    const redis = await this.checkRedis();
    const status = this.aggregateStatus(mongo, redis);

    return {
      status,
      environment: this.config.getOrThrow<string>('nodeEnv'),
      mongo,
      redis,
      database: this.config.getOrThrow<string>('mongodb.database'),
    };
  }

  private async checkMongo(): Promise<DependencyStatus> {
    if (this.connection.readyState !== 1) {
      return 'disconnected';
    }

    try {
      await this.connection.db?.admin().command({ ping: 1 });
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }

  private async checkRedis(): Promise<DependencyStatus> {
    if (!this.config.get<boolean>('redis.enabled')) {
      return 'disabled';
    }
    return (await this.redis.ping()) ? 'connected' : 'disconnected';
  }

  private aggregateStatus(
    mongo: DependencyStatus,
    redis: DependencyStatus,
  ): HealthStatus {
    if (mongo !== 'connected') {
      return 'degraded';
    }
    if (redis === 'disconnected') {
      return 'degraded';
    }
    return 'ok';
  }
}
