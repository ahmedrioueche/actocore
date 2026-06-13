import {
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ErrorCode,
  STUDIO_TEST_ACCOUNT_LEASE_TTL_SECONDS,
  type StudioTestAccountLeaseData,
} from '@ahmedrioueche/actocore-shared';
import { RedisService } from '../redis/redis.service';

type MemoryLease = {
  leaseId: string;
  expiresAt: number;
};

@Injectable()
export class StudioTestAccountLeaseService {
  private readonly logger = new Logger(StudioTestAccountLeaseService.name);
  private readonly memoryLeases = new Map<string, MemoryLease>();

  constructor(private readonly redis: RedisService) {}

  async acquire(
    email: string,
    existingLeaseId?: string,
  ): Promise<StudioTestAccountLeaseData> {
    const normalizedEmail = email.trim().toLowerCase();
    const key = this.leaseKey(normalizedEmail);
    const ttlSeconds = STUDIO_TEST_ACCOUNT_LEASE_TTL_SECONDS;

    const redisLeaseId = await this.readRedisLease(key);
    if (redisLeaseId !== null) {
      return this.resolveExistingLease(
        key,
        redisLeaseId,
        existingLeaseId,
        ttlSeconds,
        true,
      );
    }

    const memoryLease = this.readMemoryLease(key);
    if (memoryLease) {
      return this.resolveExistingLease(
        key,
        memoryLease.leaseId,
        existingLeaseId,
        ttlSeconds,
        false,
      );
    }

    return this.createLease(normalizedEmail, key, ttlSeconds);
  }

  async isActive(email: string, leaseId: string | undefined): Promise<boolean> {
    if (!leaseId?.trim()) {
      return false;
    }

    const key = this.leaseKey(email.trim().toLowerCase());
    const current =
      (await this.readRedisLease(key)) ?? this.readMemoryLease(key)?.leaseId;
    return current === leaseId;
  }

  async isAccountAvailable(
    email: string,
    ownLeaseId?: string,
  ): Promise<boolean> {
    const key = this.leaseKey(email.trim().toLowerCase());
    const currentLeaseId =
      (await this.readRedisLease(key)) ?? this.readMemoryLease(key)?.leaseId ?? null;

    if (!currentLeaseId) {
      return true;
    }

    return Boolean(ownLeaseId?.trim() && ownLeaseId === currentLeaseId);
  }

  async getRetryAfterSeconds(email: string): Promise<number> {
    const key = this.leaseKey(email.trim().toLowerCase());
    if (await this.readRedisLease(key)) {
      return this.readRedisRetryAfter(
        key,
        STUDIO_TEST_ACCOUNT_LEASE_TTL_SECONDS,
      );
    }
    if (this.readMemoryLease(key)) {
      return this.readMemoryRetryAfter(key);
    }
    return 0;
  }

  async release(email: string): Promise<void> {
    const key = this.leaseKey(email.trim().toLowerCase());
    this.memoryLeases.delete(key);

    const client = this.redis.getClient();
    if (!client) {
      return;
    }

    try {
      if (client.status !== 'ready') {
        await client.connect();
      }
      await client.del(key);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to release test account lease for ${email}: ${message}`);
    }
  }

  private async resolveExistingLease(
    key: string,
    currentLeaseId: string,
    existingLeaseId: string | undefined,
    ttlSeconds: number,
    useRedis: boolean,
  ): Promise<StudioTestAccountLeaseData> {
    if (existingLeaseId && existingLeaseId === currentLeaseId) {
      if (useRedis) {
        await this.renewRedisLease(key, ttlSeconds);
      } else {
        this.renewMemoryLease(key, currentLeaseId, ttlSeconds);
      }
      return {
        leaseId: currentLeaseId,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      };
    }

    const retryAfterSeconds = useRedis
      ? await this.readRedisRetryAfter(key, ttlSeconds)
      : this.readMemoryRetryAfter(key);

    throw new ConflictException({
      errorCode: ErrorCode.TEST_ACCOUNT_IN_USE,
      message: 'This demo account is currently in use.',
      details: { retryAfterSeconds },
    });
  }

  private async createLease(
    email: string,
    key: string,
    ttlSeconds: number,
  ): Promise<StudioTestAccountLeaseData> {
    const leaseId = randomUUID();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    const storedInRedis = await this.writeRedisLease(key, leaseId, ttlSeconds);
    if (!storedInRedis) {
      const existingRedisLease = await this.readRedisLease(key);
      if (existingRedisLease) {
        return this.resolveExistingLease(
          key,
          existingRedisLease,
          undefined,
          ttlSeconds,
          true,
        );
      }
      this.writeMemoryLease(key, leaseId, ttlSeconds);
    }

    this.logger.log(`Demo account lease acquired for ${email}`);
    return { leaseId, expiresAt };
  }

  private leaseKey(email: string): string {
    return `studio:test-account-lease:${email}`;
  }

  private async readRedisLease(key: string): Promise<string | null> {
    const client = this.redis.getClient();
    if (!client) {
      return null;
    }

    try {
      if (client.status !== 'ready') {
        await client.connect();
      }
      const value = await client.get(key);
      return value ?? null;
    } catch {
      return null;
    }
  }

  private async writeRedisLease(
    key: string,
    leaseId: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const client = this.redis.getClient();
    if (!client) {
      return false;
    }

    try {
      if (client.status !== 'ready') {
        await client.connect();
      }
      const result = await client.set(key, leaseId, 'EX', ttlSeconds, 'NX');
      if (result === 'OK') {
        return true;
      }

      const existing = await client.get(key);
      return existing === leaseId;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Redis unavailable for test account lease (${message})`);
      return false;
    }
  }

  private async renewRedisLease(key: string, ttlSeconds: number): Promise<void> {
    const client = this.redis.getClient();
    if (!client) {
      return;
    }

    try {
      if (client.status !== 'ready') {
        await client.connect();
      }
      await client.expire(key, ttlSeconds);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to renew demo lease: ${message}`);
    }
  }

  private async readRedisRetryAfter(
    key: string,
    fallbackTtl: number,
  ): Promise<number> {
    const client = this.redis.getClient();
    if (!client) {
      return fallbackTtl;
    }

    try {
      if (client.status !== 'ready') {
        await client.connect();
      }
      const ttl = await client.ttl(key);
      return typeof ttl === 'number' && ttl > 0 ? ttl : fallbackTtl;
    } catch {
      return fallbackTtl;
    }
  }

  private readMemoryLease(key: string): MemoryLease | null {
    const lease = this.memoryLeases.get(key);
    if (!lease) {
      return null;
    }
    if (lease.expiresAt <= Date.now()) {
      this.memoryLeases.delete(key);
      return null;
    }
    return lease;
  }

  private writeMemoryLease(
    key: string,
    leaseId: string,
    ttlSeconds: number,
  ): void {
    this.memoryLeases.set(key, {
      leaseId,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  private renewMemoryLease(
    key: string,
    leaseId: string,
    ttlSeconds: number,
  ): StudioTestAccountLeaseData {
    this.writeMemoryLease(key, leaseId, ttlSeconds);
    return {
      leaseId,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    };
  }

  private readMemoryRetryAfter(key: string): number {
    const lease = this.readMemoryLease(key);
    if (!lease) {
      return STUDIO_TEST_ACCOUNT_LEASE_TTL_SECONDS;
    }
    return Math.max(1, Math.ceil((lease.expiresAt - Date.now()) / 1000));
  }
}
