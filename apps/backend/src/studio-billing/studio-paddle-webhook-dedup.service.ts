import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StudioPaddleWebhookEventModel } from './schemas/billing.schema';
import { isMongoDuplicateKeyError } from './utils/mongo-duplicate.util';

@Injectable()
export class StudioPaddleWebhookDedupService {
  private readonly logger = new Logger(StudioPaddleWebhookDedupService.name);

  constructor(
    @InjectModel(StudioPaddleWebhookEventModel.name)
    private readonly eventModel: Model<StudioPaddleWebhookEventModel>,
  ) {}

  /**
   * Returns true if this event should be processed (first delivery).
   * Returns false if Paddle event_id was already handled (retry).
   */
  async claimEvent(eventId: string, eventType: string): Promise<boolean> {
    const id = eventId?.trim();
    if (!id) {
      this.logger.warn('Paddle webhook missing event_id — processing without dedup store');
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
        this.logger.debug(`Skipping duplicate Paddle webhook event_id=${eventId}`);
        return false;
      }
      throw error;
    }
  }
}
