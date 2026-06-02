import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../redis/redis.service';
import { UsageService } from '../usage/usage.service';
import { QuotaService } from './quota.service';

describe('QuotaService', () => {
  it('rejects when per-minute limit is exceeded', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotaService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: () => ({
              enabled: true,
              chatPerMinute: 2,
              chatPerDay: 100,
              chatPerMonth: 1000,
            }),
          },
        },
        { provide: RedisService, useValue: { getClient: () => null } },
        {
          provide: UsageService,
          useValue: { countChatRequestsThisMonth: jest.fn().mockResolvedValue(0) },
        },
      ],
    }).compile();

    const quota = module.get(QuotaService);

    await quota.consumeChatQuota('proj-1');
    await quota.consumeChatQuota('proj-1');

    await expect(quota.consumeChatQuota('proj-1')).rejects.toMatchObject({
      status: 429,
    });
  });
});
