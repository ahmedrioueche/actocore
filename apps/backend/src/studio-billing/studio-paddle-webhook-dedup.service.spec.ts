import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { StudioPaddleWebhookEventModel } from './schemas/billing.schema';
import { StudioPaddleWebhookDedupService } from './studio-paddle-webhook-dedup.service';

describe('StudioPaddleWebhookDedupService', () => {
  const store = new Map<string, { eventId: string; eventType: string }>();

  const mockModel = {
    create: jest.fn(async (doc: { eventId: string; eventType: string }) => {
      if (store.has(doc.eventId)) {
        const err = new Error('duplicate') as Error & { code: number };
        err.code = 11000;
        throw err;
      }
      store.set(doc.eventId, doc);
      return doc;
    }),
  };

  let service: StudioPaddleWebhookDedupService;

  beforeEach(async () => {
    store.clear();
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudioPaddleWebhookDedupService,
        {
          provide: getModelToken(StudioPaddleWebhookEventModel.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get(StudioPaddleWebhookDedupService);
  });

  it('claims a new event_id once', async () => {
    await expect(service.claimEvent('evt_01', 'transaction.completed')).resolves.toBe(
      true,
    );
    await expect(service.claimEvent('evt_01', 'transaction.completed')).resolves.toBe(
      false,
    );
  });

  it('processes webhooks without event_id (no dedup store)', async () => {
    await expect(service.claimEvent('', 'subscription.updated')).resolves.toBe(true);
    await expect(service.claimEvent('', 'subscription.updated')).resolves.toBe(true);
    expect(store.size).toBe(0);
  });
});
