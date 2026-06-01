import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { RedisService } from '../redis/redis.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthService;

  const mockConnection = {
    readyState: 1,
    db: {
      admin: () => ({
        command: jest.fn().mockResolvedValue({ ok: 1 }),
      }),
    },
  };

  const mockConfig = {
    getOrThrow: (key: string) => {
      const values: Record<string, string | boolean> = {
        nodeEnv: 'test',
        'mongodb.database': 'actocore_test',
        'redis.enabled': false,
      };
      return values[key];
    },
    get: (key: string) => {
      if (key === 'redis.enabled') return false;
      return undefined;
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        { provide: getConnectionToken(), useValue: mockConnection },
        { provide: ConfigService, useValue: mockConfig },
        { provide: RedisService, useValue: { ping: jest.fn() } },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);
  });

  it('returns live status', () => {
    expect(controller.getLive()).toEqual({
      success: true,
      data: { status: 'ok' },
    });
  });

  it('returns ready status when mongo is connected', async () => {
    const result = await controller.getReady({ status: jest.fn() } as never);

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('ok');
    expect(result.data?.mongo).toBe('connected');
    expect(result.data?.redis).toBe('disabled');
  });

  it('returns degraded when mongo ping fails', async () => {
    jest.spyOn(healthService, 'getReady').mockResolvedValue({
      status: 'degraded',
      environment: 'test',
      mongo: 'disconnected',
      redis: 'disabled',
      database: 'actocore_test',
    });

    const res = { status: jest.fn() };
    const result = await controller.getReady(res as never);

    expect(result.data?.status).toBe('degraded');
    expect(res.status).toHaveBeenCalledWith(503);
  });
});
