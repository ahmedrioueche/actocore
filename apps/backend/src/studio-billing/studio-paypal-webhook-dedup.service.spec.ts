import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { StudioPayPalWebhookEventModel } from './schemas/billing.schema';
import { StudioPayPalWebhookDedupService } from './studio-paypal-webhook-dedup.service';

describe('StudioPayPalWebhookDedupService', () => {
  let service: StudioPayPalWebhookDedupService;
  const stored: Array<{ eventId: string; eventType: string }> = [];

  beforeEach(async () => {
    stored.length = 0;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudioPayPalWebhookDedupService,
        {
          provide: getModelToken(StudioPayPalWebhookEventModel.name),
          useValue: {
            create: jest.fn(async (doc: { eventId: string; eventType: string }) => {
              if (stored.some((row) => row.eventId === doc.eventId)) {
                const err = new Error('duplicate') as Error & { code: number };
                err.code = 11000;
                throw err;
              }
              stored.push(doc);
              return doc;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(StudioPayPalWebhookDedupService);
  });

  it('claims first event delivery', async () => {
    await expect(service.claimEvent('evt-1', 'BILLING.SUBSCRIPTION.ACTIVATED')).resolves.toBe(
      true,
    );
  });

  it('rejects duplicate event delivery', async () => {
    await service.claimEvent('evt-1', 'BILLING.SUBSCRIPTION.ACTIVATED');
    await expect(service.claimEvent('evt-1', 'BILLING.SUBSCRIPTION.ACTIVATED')).resolves.toBe(
      false,
    );
  });
});
