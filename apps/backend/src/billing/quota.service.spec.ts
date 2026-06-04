import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Project } from '../projects/schemas/project.schema';
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
              alertPercentages: [80, 90, 100] as [number, number, number],
            }),
          },
        },
        { provide: RedisService, useValue: { getClient: () => null } },
        {
          provide: UsageService,
          useValue: { countChatRequestsThisMonth: jest.fn().mockResolvedValue(0) },
        },
        {
          provide: getModelToken(Project.name),
          useValue: { findById: () => ({ lean: () => ({ exec: async () => null }) }) },
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
