import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { RedisService } from '../redis/redis.service';

describe('HealthService', () => {
  let service: HealthService;

  const mockConfig = {
    getOrThrow: (key: string) => {
      const values: Record<string, string> = {
        nodeEnv: 'test',
        'mongodb.database': 'actocore_test',
      };
      return values[key];
    },
    get: (key: string) => key === 'redis.enabled' && false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: getConnectionToken(),
          useValue: {
            readyState: 1,
            db: {
              admin: () => ({
                command: jest.fn().mockResolvedValue({ ok: 1 }),
              }),
            },
          },
        },
        { provide: ConfigService, useValue: mockConfig },
        { provide: RedisService, useValue: { ping: jest.fn() } },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('reports ok when mongo responds to ping', async () => {
    const result = await service.getReady();
    expect(result.status).toBe('ok');
    expect(result.mongo).toBe('connected');
    expect(result.redis).toBe('disabled');
  });
});
