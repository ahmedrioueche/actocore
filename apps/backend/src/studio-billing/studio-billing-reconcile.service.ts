import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PayPalConfig } from '../config/paypal.config';
import { StudioSubscriptionService } from './studio-subscription.service';

const RECONCILE_INTERVAL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class StudioBillingReconcileService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(StudioBillingReconcileService.name);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly subscriptions: StudioSubscriptionService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    void this.runReconciliation();
    this.intervalId = setInterval(() => {
      void this.runReconciliation();
    }, RECONCILE_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async runReconciliation(): Promise<void> {
    const paypal = this.config.get<PayPalConfig>('paypal');
    if (!paypal?.clientId || !paypal.clientSecret) {
      return;
    }

    try {
      const [synced, cancelled] = await Promise.all([
        this.subscriptions.reconcilePayPalSubscriptions(),
        this.subscriptions.processDeferredPayPalCancels(),
      ]);
      if (synced > 0 || cancelled > 0) {
        this.logger.log(
          `Billing reconcile: synced=${synced}, deferred_cancels=${cancelled}`,
        );
      }
    } catch (error) {
      this.logger.error('Billing reconciliation failed', error);
    }
  }
}
