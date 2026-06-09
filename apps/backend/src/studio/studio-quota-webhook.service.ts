import { Injectable, Logger } from '@nestjs/common';
import type { StudioAccountDocument } from './schemas/studio-account.schema';

@Injectable()
export class StudioQuotaWebhookService {
  private readonly logger = new Logger(StudioQuotaWebhookService.name);

  async notifyThreshold(
    account: StudioAccountDocument,
    payload: {
      percent: number;
      used: number;
      limit: number;
      subject: string;
    },
  ): Promise<void> {
    const url = account.preferences?.quotaWebhookUrl?.trim();
    if (!url?.startsWith('https://')) {
      return;
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'quota.threshold',
          accountId: account._id.toString(),
          accountName: account.name,
          percent: payload.percent,
          monthlyTokensUsed: payload.used,
          monthlyTokenLimit: payload.limit,
          subject: payload.subject,
          occurredAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        this.logger.warn(
          `Quota webhook ${url} returned ${res.status} for account ${account._id}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Quota webhook failed for account ${account._id}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    }
  }
}
