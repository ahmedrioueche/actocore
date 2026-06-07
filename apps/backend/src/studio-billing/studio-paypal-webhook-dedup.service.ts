import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StudioPayPalWebhookEventModel } from './schemas/billing.schema';
import { isMongoDuplicateKeyError } from './utils/mongo-duplicate.util';

@Injectable()
export class StudioPayPalWebhookDedupService {
  private readonly logger = new Logger(StudioPayPalWebhookDedupService.name);

  constructor(
    @InjectModel(StudioPayPalWebhookEventModel.name)
    private readonly eventModel: Model<StudioPayPalWebhookEventModel>,
  ) {}

  async claimEvent(eventId: string, eventType: string): Promise<boolean> {
    const id = eventId?.trim();
    if (!id) {
      this.logger.warn('PayPal webhook missing event id — processing without dedup store');
      return true;
    }

    try {
      await this.eventModel.create({
        eventId: id,
        eventType,
        processedAt: new Date(),
      });
      return true;
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        this.logger.debug(`Skipping duplicate PayPal webhook event_id=${eventId}`);
        return false;
      }
      throw error;
    }
  }
}
