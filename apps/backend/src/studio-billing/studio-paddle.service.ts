import {
  ErrorCode,
  type AppSubscriptionBillingCycle,
} from '@ahmedrioueche/actocore-shared';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import type { PaddleConfig } from '../config/paddle.config';
import { StudioPlanModel } from './schemas/billing.schema';
import type { PaddleWebhookPayload } from './paddle-webhook.types';
import { StudioPaddleWebhookDedupService } from './studio-paddle-webhook-dedup.service';
import { StudioPlansService } from './studio-plans.service';
import { StudioSubscriptionService } from './studio-subscription.service';

export interface PaddleSubscriptionData {
  paddleSubscriptionId: string;
  status: string;
  billingCycle?: AppSubscriptionBillingCycle;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  nextPaymentDate?: Date;
  cancelAtPeriodEnd?: boolean;
  scheduledCancellationDate?: Date;
  priceId?: string;
}

@Injectable()
export class StudioPaddleService {
  private readonly logger = new Logger(StudioPaddleService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly plans: StudioPlansService,
    @Inject(forwardRef(() => StudioSubscriptionService))
    private readonly subscriptions: StudioSubscriptionService,
    private readonly webhookDedup: StudioPaddleWebhookDedupService,
  ) {}

  async handleWebhookPayload(event: PaddleWebhookPayload): Promise<boolean> {
    const shouldProcess = await this.webhookDedup.claimEvent(
      event.event_id ?? '',
      event.event_type,
    );
    if (!shouldProcess) {
      return false;
    }

    await this.handleWebhook(event);
    return true;
  }

  private cfg(): PaddleConfig {
    return this.config.getOrThrow<PaddleConfig>('paddle');
  }

  async createSubscriptionCheckout(
    accountId: string,
    planId: string,
    billingCycle: AppSubscriptionBillingCycle = 'monthly',
    customerId?: string,
  ): Promise<{
    checkout_url: string;
    transaction_id: string;
    trialEligible?: boolean;
    trialDays?: number;
  }> {
    const { apiKey, apiUrl } = this.cfg();
    if (!apiKey) {
      throw new BadRequestException({
        errorCode: ErrorCode.BILLING_NOT_CONFIGURED,
        message: 'Paddle is not configured',
      });
    }

    const plan = await this.plans.getByPlanId(planId);
    if (plan.level === 'free') {
      throw new BadRequestException('Cannot checkout the free plan');
    }
    if (!plan.paddlePriceIds) {
      throw new BadRequestException('Plan has no Paddle price IDs');
    }

    const trialEligibility = await this.subscriptions.getTrialEligibility(
      accountId,
      planId,
    );

    const priceId = this.getPaddlePriceId(plan, billingCycle);
    if (!priceId) {
      throw new BadRequestException('Paddle price not found for billing cycle');
    }

    const item: {
      price_id: string;
      quantity: number;
      trial_period?: { interval: 'day'; frequency: number };
    } = { price_id: priceId, quantity: 1 };

    if (trialEligibility.eligible && trialEligibility.trialDays) {
      item.trial_period = {
        interval: 'day',
        frequency: trialEligibility.trialDays,
      };
    }

    const payload = {
      items: [item],
      customer_id: customerId,
      custom_data: {
        accountId,
        planId,
        billingCycle,
        trialEligible: trialEligibility.eligible,
      },
    };

    const response = await axios.post(`${apiUrl}/transactions`, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const transaction = response.data.data;
    if (!transaction?.checkout?.url) {
      throw new BadRequestException('Paddle did not return checkout URL');
    }

    return {
      checkout_url: transaction.checkout.url as string,
      transaction_id: transaction.id as string,
      trialEligible: trialEligibility.eligible,
      trialDays: trialEligibility.trialDays,
    };
  }

  getPaddlePriceId(
    plan: StudioPlanModel | { paddlePriceIds?: { monthly?: string; yearly?: string } },
    billingCycle: AppSubscriptionBillingCycle,
  ): string | null {
    if (!plan.paddlePriceIds) {
      return null;
    }
    return billingCycle === 'yearly'
      ? plan.paddlePriceIds.yearly ?? null
      : plan.paddlePriceIds.monthly ?? null;
  }

  async getTransactionStatus(transactionId: string) {
    const { apiKey, apiUrl } = this.cfg();
    const response = await axios.get(`${apiUrl}/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = response.data.data;
    return {
      id: data.id,
      status: data.status,
      subscription_id: data.subscription_id,
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<PaddleSubscriptionData> {
    const { apiKey, apiUrl } = this.cfg();
    const response = await axios.post(
      `${apiUrl}/subscriptions/${subscriptionId}/cancel`,
      { effective_from: 'next_billing_period' },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return this.mapPaddleSubscriptionData(response.data.data);
  }

  async schedulePlanChangeAtPeriodEnd(
    subscriptionId: string,
    priceId: string,
  ): Promise<PaddleSubscriptionData> {
    const { apiKey, apiUrl } = this.cfg();
    const response = await axios.patch(
      `${apiUrl}/subscriptions/${subscriptionId}`,
      {
        items: [{ price_id: priceId, quantity: 1 }],
        proration_billing_mode: 'do_not_bill',
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return this.mapPaddleSubscriptionData(response.data.data);
  }

  async clearScheduledPlanChange(
    subscriptionId: string,
    currentPriceId: string,
  ): Promise<PaddleSubscriptionData> {
    const { apiKey, apiUrl } = this.cfg();
    const response = await axios.patch(
      `${apiUrl}/subscriptions/${subscriptionId}`,
      {
        items: [{ price_id: currentPriceId, quantity: 1 }],
        proration_billing_mode: 'do_not_bill',
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return this.mapPaddleSubscriptionData(response.data.data);
  }

  async reactivateSubscription(
    subscriptionId: string,
  ): Promise<PaddleSubscriptionData> {
    const { apiKey, apiUrl } = this.cfg();
    const current = await axios.get(`${apiUrl}/subscriptions/${subscriptionId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const subscription = current.data.data;
    if (subscription.scheduled_change?.action !== 'cancel') {
      return this.mapPaddleSubscriptionData(subscription);
    }
    const response = await axios.patch(
      `${apiUrl}/subscriptions/${subscriptionId}`,
      { scheduled_change: null },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return this.mapPaddleSubscriptionData(response.data.data);
  }

  verifyWebhookSignature(signature: string, body: string): boolean {
    const secret = this.cfg().webhookSecret;
    if (!secret) {
      return false;
    }
    const parts = signature.split(';');
    const ts = parts.find((p) => p.startsWith('ts='))?.split('=')[1];
    const h1 = parts.find((p) => p.startsWith('h1='))?.split('=')[1];
    if (!ts || !h1) {
      return false;
    }
    const computed = crypto
      .createHmac('sha256', secret)
      .update(`${ts}:${body}`)
      .digest('hex');
    const h1Buffer = Buffer.from(h1, 'hex');
    const computedBuffer = Buffer.from(computed, 'hex');
    if (h1Buffer.length !== computedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(h1Buffer, computedBuffer);
  }

  private async handleWebhook(event: PaddleWebhookPayload) {
    switch (event.event_type) {
      case 'transaction.completed':
        await this.handleTransactionCompleted(event.data);
        break;
      case 'subscription.updated':
        await this.subscriptions.syncFromPaddleData(
          this.mapPaddleSubscriptionData(event.data),
        );
        break;
      case 'subscription.canceled':
        await this.subscriptions.syncFromPaddleData(
          this.mapPaddleSubscriptionData(event.data),
        );
        break;
      default:
        this.logger.debug(`Ignored Paddle event ${event.event_type}`);
    }
  }

  private async handleTransactionCompleted(data: Record<string, unknown>) {
    const customData = data.custom_data as
      | { accountId?: string; planId?: string; billingCycle?: AppSubscriptionBillingCycle }
      | undefined;
    const details = data.details as { totals?: { total?: string } } | undefined;
    const amountPaid = details?.totals?.total
      ? parseInt(details.totals.total, 10) / 100
      : undefined;

    await this.subscriptions.handlePaddleTransactionCompleted({
      transactionId: String(data.id),
      paddleSubscriptionId: String(data.subscription_id),
      customData,
      paddleCustomerId: data.customer_id as string | undefined,
      currency: data.currency_code as string | undefined,
      amountPaid,
    });
  }

  async previewSubscriptionUpgrade(
    subscriptionId: string,
    priceId: string,
    prorationBillingMode = 'prorated_immediately',
  ): Promise<Record<string, unknown>> {
    const { apiKey, apiUrl } = this.cfg();
    if (!apiKey) {
      throw new BadRequestException({
        errorCode: ErrorCode.BILLING_NOT_CONFIGURED,
        message: 'Paddle is not configured',
      });
    }

    const response = await axios.patch(
      `${apiUrl}/subscriptions/${subscriptionId}/preview`,
      {
        items: [{ price_id: priceId, quantity: 1 }],
        proration_billing_mode: prorationBillingMode,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data.data as Record<string, unknown>;
  }

  async upgradeSubscriptionImmediately(
    subscriptionId: string,
    priceId: string,
  ): Promise<PaddleSubscriptionData> {
    const { apiKey, apiUrl } = this.cfg();
    if (!apiKey) {
      throw new BadRequestException({
        errorCode: ErrorCode.BILLING_NOT_CONFIGURED,
        message: 'Paddle is not configured',
      });
    }

    const response = await axios.patch(
      `${apiUrl}/subscriptions/${subscriptionId}`,
      {
        items: [{ price_id: priceId, quantity: 1 }],
        proration_billing_mode: 'prorated_immediately',
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return this.mapPaddleSubscriptionData(response.data.data);
  }

  async createCustomerPortalSession(
    customerId: string,
    subscriptionIds?: string[],
  ): Promise<{ portalUrl: string; subscriptionPortalUrl?: string }> {
    const { apiKey, apiUrl } = this.cfg();
    if (!apiKey) {
      throw new BadRequestException({
        errorCode: ErrorCode.BILLING_NOT_CONFIGURED,
        message: 'Paddle is not configured',
      });
    }

    const payload: { subscription_ids?: string[] } = {};
    if (subscriptionIds?.length) {
      payload.subscription_ids = subscriptionIds;
    }

    const response = await axios.post(
      `${apiUrl}/customers/${customerId}/portal-sessions`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const data = response.data.data as {
      urls?: {
        general?: { overview?: string };
        subscriptions?: { id?: string; update_subscription?: string }[];
      };
    };

    const portalUrl = data.urls?.general?.overview;
    if (!portalUrl) {
      throw new BadRequestException('Paddle did not return a customer portal URL');
    }

    const subscriptionPortalUrl =
      data.urls?.subscriptions?.[0]?.update_subscription;

    return { portalUrl, subscriptionPortalUrl };
  }

  mapPaddleSubscriptionData(paddleData: Record<string, unknown>): PaddleSubscriptionData {
    const items = paddleData.items as
      | { price?: { id?: string; billing_cycle?: { interval?: string } } }[]
      | undefined;
    const priceId = items?.[0]?.price?.id;
    const interval = items?.[0]?.price?.billing_cycle?.interval;
    let billingCycle: AppSubscriptionBillingCycle = 'monthly';
    if (interval === 'year') {
      billingCycle = 'yearly';
    }

    const scheduledChange = paddleData.scheduled_change as
      | { action?: string; effective_at?: string }
      | undefined;
    const period = paddleData.current_billing_period as
      | { starts_at?: string; ends_at?: string }
      | undefined;

    return {
      paddleSubscriptionId: String(paddleData.id),
      status: String(paddleData.status),
      priceId,
      billingCycle,
      currentPeriodStart: period?.starts_at
        ? new Date(period.starts_at)
        : undefined,
      currentPeriodEnd: period?.ends_at ? new Date(period.ends_at) : undefined,
      nextPaymentDate: paddleData.next_billed_at
        ? new Date(String(paddleData.next_billed_at))
        : undefined,
      cancelAtPeriodEnd: scheduledChange?.action === 'cancel',
      scheduledCancellationDate: scheduledChange?.effective_at
        ? new Date(scheduledChange.effective_at)
        : undefined,
    };
  }
}
