import { ConflictException } from '@nestjs/common';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { StudioTestAccountLeaseService } from './studio-test-account-lease.service';
import { RedisService } from '../redis/redis.service';

describe('StudioTestAccountLeaseService', () => {
  const email = 'demo1@actocore.test';

  function createService(redisClient: unknown = null) {
    const redis = {
      getClient: jest.fn(() => redisClient),
    } as unknown as RedisService;
    return new StudioTestAccountLeaseService(redis);
  }

  it('acquires a new lease when none exists', async () => {
    const service = createService(null);
    const lease = await service.acquire(email);

    expect(lease.leaseId).toEqual(expect.any(String));
    expect(new Date(lease.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(await service.isActive(email, lease.leaseId)).toBe(true);
  });

  it('renews the same lease id for the same visitor', async () => {
    const service = createService(null);
    const first = await service.acquire(email);
    const renewed = await service.acquire(email, first.leaseId);

    expect(renewed.leaseId).toBe(first.leaseId);
    expect(await service.isActive(email, first.leaseId)).toBe(true);
  });

  it('blocks another visitor while the lease is active', async () => {
    const service = createService(null);
    const first = await service.acquire(email);

    await expect(service.acquire(email)).rejects.toBeInstanceOf(ConflictException);
    expect(await service.isAccountAvailable(email)).toBe(false);
    expect(await service.isAccountAvailable(email, first.leaseId)).toBe(true);
    const error = await service.acquire(email).catch((err) => err);
    expect(error).toBeInstanceOf(ConflictException);
    const body = (error as ConflictException).getResponse() as {
      errorCode: string;
      details: { retryAfterSeconds: number };
    };
    expect(body.errorCode).toBe(ErrorCode.TEST_ACCOUNT_IN_USE);
    expect(body.details.retryAfterSeconds).toBeGreaterThan(0);
    expect(await service.isActive(email, first.leaseId)).toBe(true);
  });

  it('releases the lease on logout', async () => {
    const service = createService(null);
    const lease = await service.acquire(email);

    expect(await service.isAccountAvailable(email)).toBe(false);

    await service.release(email);

    expect(await service.isAccountAvailable(email)).toBe(true);

    expect(await service.isActive(email, lease.leaseId)).toBe(false);
    await expect(service.acquire(email)).resolves.toEqual(
      expect.objectContaining({ leaseId: expect.any(String) }),
    );
  });
});
