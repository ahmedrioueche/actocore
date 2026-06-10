import {
  ErrorCode,
  type AppSubscriptionBillingCycle,
} from '@ahmedrioueche/actocore-shared';
import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { randomUUID } from 'crypto';
import type { PayPalConfig } from '../config/paypal.config';
import type { PayPalWebhookPayload } from './paypal-webhook.types';
import { StudioPlanModel } from './schemas/billing.schema';
import { StudioPayPalHttpService } from './studio-paypal-http.service';
import { StudioPayPalWebhookDedupService } from './studio-paypal-webhook-dedup.service';
import { StudioPlansService } from './studio-plans.service';
import { StudioAdminNotificationService } from '../studio/studio-admin-notification.service';
import { StudioSubscriptionService } from './studio-subscription.service';
import {
  decodePayPalCustomId,
  encodePayPalCustomId,
} from './utils/paypal-custom-id.util';

export interface PayPalSubscriptionData {
  paypalSubscriptionId: string;
  status: string;
  billingCycle?: AppSubscriptionBillingCycle;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  nextPaymentDate?: Date;
  planId?: string;
  payerId?: string;
}

@Injectable()
export class StudioPayPalService {
  private readonly logger = new Logger(StudioPayPalService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly paypalHttp: StudioPayPalHttpService,
    @Inject(forwardRef(() => StudioPlansService))
    private readonly plans: StudioPlansService,
    @Inject(forwardRef(() => StudioSubscriptionService))
    private readonly subscriptions: StudioSubscriptionService,
    private readonly webhookDedup: StudioPayPalWebhookDedupService,
    private readonly adminNotifications: StudioAdminNotificationService,
  ) {}

  private cfg(): PayPalConfig {
    return this.config.getOrThrow<PayPalConfig>('paypal');
  }

  isConfigured(): boolean {
    return this.paypalHttp.isConfigured();
  }

  private ensureConfigured(): void {
    this.paypalHttp.ensureConfigured();
  }

  async getAccessToken(): Promise<string> {
    return this.paypalHttp.getAccessToken();
  }

  async billingApiRequest<T>(
    method: 'get' | 'post' | 'patch',
    path: string,
    body?: unknown,
    requestId?: string,
  ): Promise<T> {
    return this.paypalHttp.billingApiRequest(method, path, body, requestId);
  }

  async createSubscriptionCheckout(
    accountId: string,
    planId: string,
    billingCycle: AppSubscriptionBillingCycle = 'monthly',
  ): Promise<{
    approval_url: string;
    subscription_id: string;
  }> {
    this.ensureConfigured();
    const plan = await this.plans.getByPlanId(planId);
    if (plan.level === 'free') {
      throw new BadRequestException('Cannot checkout the free plan');
    }

    const paypalPlanId = this.getPayPalPlanId(plan, billingCycle);
    if (!paypalPlanId) {
      throw new BadRequestException('PayPal plan not configured for billing cycle');
    }

    const { returnUrl, cancelUrl, apiBaseUrl } = this.cfg();
    const sandbox = apiBaseUrl.includes('sandbox');
    const applicationContext: Record<string, unknown> = {
      brand_name: 'ActoCore Studio',
      locale: 'en-US',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      return_url: returnUrl,
      cancel_url: cancelUrl,
    };
    if (!sandbox) {
      applicationContext.payment_method = {
        payer_selected: 'PAYPAL',
        payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
      };
    }
    const payload = {
      plan_id: paypalPlanId,
      custom_id: encodePayPalCustomId({ accountId, planId, billingCycle }),
      application_context: applicationContext,
    };

    const data = await this.billingApiRequest<{
      id: string;
      links?: { href: string; rel: string }[];
    }>('post', '/v1/billing/subscriptions', payload, randomUUID());

    const approvalUrl = data.links?.find((link) => link.rel === 'approve')?.href;
    if (!approvalUrl) {
      throw new BadRequestException('PayPal did not return approval URL');
    }

    return {
      approval_url: approvalUrl,
      subscription_id: data.id,
    };
  }

  getPayPalPlanId(
    plan: StudioPlanModel | { paypalPlanIds?: { monthly?: string; yearly?: string } },
    billingCycle: AppSubscriptionBillingCycle,
  ): string | null {
    if (!plan.paypalPlanIds) {
      return null;
    }
    return billingCycle === 'yearly'
      ? plan.paypalPlanIds.yearly ?? null
      : plan.paypalPlanIds.monthly ?? null;
  }

  async getSubscriptionStatus(subscriptionId: string, accountId: string) {
    this.ensureConfigured();
    const raw = await this.billingApiRequest<Record<string, unknown>>(
      'get',
      `/v1/billing/subscriptions/${subscriptionId}`,
    );
    const customId = raw.custom_id as string | undefined;
    const custom = decodePayPalCustomId(customId);
    if (custom?.accountId && custom.accountId !== accountId) {
      throw new ForbiddenException('Subscription does not belong to this account');
    }

    const data = this.mapPayPalSubscriptionData(raw);
    if (data.status.toUpperCase() === 'ACTIVE') {
      await this.subscriptions.activateFromPayPalWebhook(data, customId);
    }

    return {
      id: data.paypalSubscriptionId,
      status: data.status,
      plan_id: data.planId,
    };
  }

  async fetchSubscription(subscriptionId: string): Promise<PayPalSubscriptionData> {
    this.ensureConfigured();
    const data = await this.billingApiRequest<Record<string, unknown>>(
      'get',
      `/v1/billing/subscriptions/${subscriptionId}`,
    );
    return this.mapPayPalSubscriptionData(data);
  }

  async reviseSubscription(
    subscriptionId: string,
    targetPlanId: string,
    billingCycle: AppSubscriptionBillingCycle = 'monthly',
  ): Promise<{ approvalUrl?: string; data: PayPalSubscriptionData }> {
    this.ensureConfigured();
    const plan = await this.plans.getByPlanId(targetPlanId);
    const paypalPlanId = this.getPayPalPlanId(plan, billingCycle);
    if (!paypalPlanId) {
      throw new BadRequestException('PayPal plan not configured for target plan');
    }

    const { returnUrl, cancelUrl } = this.cfg();
    const response = await this.billingApiRequest<{
      links?: { href: string; rel: string }[];
    }>(
      'post',
      `/v1/billing/subscriptions/${subscriptionId}/revise`,
      {
        plan_id: paypalPlanId,
        application_context: {
          brand_name: 'ActoCore Studio',
          shipping_preference: 'NO_SHIPPING',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
          },
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      },
      randomUUID(),
    );

    const approvalUrl = response.links?.find((link) => link.rel === 'approve')?.href;
    const data = await this.fetchSubscription(subscriptionId);
    return { approvalUrl, data };
  }

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
    this.ensureConfigured();
    await this.billingApiRequest(
      'post',
      `/v1/billing/subscriptions/${subscriptionId}/cancel`,
      { reason: reason ?? 'Customer requested cancellation' },
      randomUUID(),
    );
  }

  async verifyWebhookSignature(
    headers: Record<string, string | undefined>,
    event: PayPalWebhookPayload,
  ): Promise<boolean> {
    const webhookId = this.cfg().webhookId;
    if (!webhookId) {
      this.logger.warn('PAYPAL_WEBHOOK_ID not set — skipping verification');
      return true;
    }

    const authAlgo = headers['paypal-auth-algo'];
    const certUrl = headers['paypal-cert-url'];
    const transmissionId = headers['paypal-transmission-id'];
    const transmissionSig = headers['paypal-transmission-sig'];
    const transmissionTime = headers['paypal-transmission-time'];

    if (
      !authAlgo ||
      !certUrl ||
      !transmissionId ||
      !transmissionSig ||
      !transmissionTime
    ) {
      return false;
    }

    try {
      const result = await this.billingApiRequest<{ verification_status?: string }>(
        'post',
        '/v1/notifications/verify-webhook-signature',
        {
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          transmission_time: transmissionTime,
          webhook_id: webhookId,
          webhook_event: event,
        },
      );
      return result.verification_status === 'SUCCESS';
    } catch (error) {
      this.logger.error('PayPal webhook verification failed', error);
      return false;
    }
  }

  async handleWebhookPayload(event: PayPalWebhookPayload): Promise<boolean> {
    const shouldProcess = await this.webhookDedup.claimEvent(
      event.id ?? '',
      event.event_type,
    );
    if (!shouldProcess) {
      return false;
    }

    await this.handleWebhook(event);
    return true;
  }

  private async handleWebhook(event: PayPalWebhookPayload) {
    const resource = event.resource ?? {};
    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await this.subscriptions.activateFromPayPalWebhook(
          this.mapPayPalSubscriptionData(resource),
          resource.custom_id as string | undefined,
        );
        break;
      case 'BILLING.SUBSCRIPTION.UPDATED':
      case 'BILLING.SUBSCRIPTION.RE-ACTIVATED':
        await this.subscriptions.syncFromPayPalData(
          this.mapPayPalSubscriptionData(resource),
        );
        break;
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await this.subscriptions.syncFromPayPalData({
          ...this.mapPayPalSubscriptionData(resource),
          status: 'CANCELLED',
        });
        break;
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await this.subscriptions.syncFromPayPalData({
          ...this.mapPayPalSubscriptionData(resource),
          status: 'SUSPENDED',
        });
        await this.notifyBillingFailure(
          resource,
          'Subscription suspended',
          'PayPal suspended your subscription after a failed payment.',
        );
        break;
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        this.logger.warn(
          `PayPal subscription payment failed: ${String(resource.id ?? '')}`,
        );
        await this.notifyBillingFailure(
          resource,
          'Payment failed',
          'PayPal could not charge your subscription.',
        );
        break;
      case 'PAYMENT.SALE.COMPLETED':
        await this.handlePaymentSaleCompleted(resource);
        break;
      case 'BILLING.SUBSCRIPTION.CREATED':
        this.logger.log(
          `PayPal subscription created (awaiting activation): ${String(resource.id ?? '')} status=${String(resource.status ?? '')}`,
        );
        break;
      default:
        this.logger.debug(`Ignored PayPal event ${event.event_type}`);
    }
  }

  private async handlePaymentSaleCompleted(resource: Record<string, unknown>) {
    const billingAgreementId = resource.billing_agreement_id as string | undefined;
    const transactionId = String(resource.id ?? '');
    const amount = resource.amount as
      | { total?: string; currency?: string }
      | undefined;
    const amountPaid = amount?.total ? parseFloat(amount.total) : undefined;

    if (!billingAgreementId) {
      this.logger.debug('PAYMENT.SALE.COMPLETED without billing_agreement_id');
      return;
    }

    await this.subscriptions.handlePayPalPaymentCompleted({
      paypalSubscriptionId: billingAgreementId,
      transactionId,
      amountPaid,
      currency: amount?.currency,
    });
  }

  mapPayPalSubscriptionData(
    paypalData: Record<string, unknown>,
  ): PayPalSubscriptionData {
    const planId = paypalData.plan_id as string | undefined;
    const billingInfo = paypalData.billing_info as
      | {
          next_billing_time?: string;
          last_payment?: { time?: string; amount?: { currency_code?: string } };
        }
      | undefined;

    const custom = decodePayPalCustomId(paypalData.custom_id as string | undefined);
    let billingCycle: AppSubscriptionBillingCycle = 'monthly';
    if (custom?.billingCycle === 'yearly') {
      billingCycle = 'yearly';
    }

    const startTime = paypalData.start_time
      ? new Date(String(paypalData.start_time))
      : undefined;
    const nextBilling = billingInfo?.next_billing_time
      ? new Date(billingInfo.next_billing_time)
      : undefined;

    const subscriber = paypalData.subscriber as { payer_id?: string } | undefined;

    return {
      paypalSubscriptionId: String(paypalData.id),
      status: String(paypalData.status ?? 'UNKNOWN'),
      planId,
      billingCycle: custom?.billingCycle as AppSubscriptionBillingCycle | undefined ?? billingCycle,
      currentPeriodStart: startTime,
      currentPeriodEnd: nextBilling,
      nextPaymentDate: nextBilling,
      payerId: subscriber?.payer_id,
    };
  }

  private async notifyBillingFailure(
    resource: Record<string, unknown>,
    subject: string,
    detail: string,
  ): Promise<void> {
    const paypalSubscriptionId = String(resource.id ?? '');
    if (!paypalSubscriptionId) {
      return;
    }

    const accountId =
      await this.subscriptions.findAccountIdByPayPalSubscription(
        paypalSubscriptionId,
      );
    if (!accountId) {
      this.logger.warn(
        `PayPal billing alert skipped: no local subscription for ${paypalSubscriptionId}`,
      );
      return;
    }

    await this.adminNotifications.maybeNotifyFailure(
      accountId,
      'billing',
      `Billing alert: ${subject}`,
      [
        detail,
        `PayPal subscription ID: ${paypalSubscriptionId}`,
        '',
        'Review billing in ActoCore Studio → Billing.',
      ].join('\n'),
    );
  }

  getManageUrl(): string {
    const sandbox = this.cfg().apiBaseUrl.includes('sandbox');
    return sandbox
      ? 'https://www.sandbox.paypal.com/myaccount/autopay/'
      : 'https://www.paypal.com/myaccount/autopay/';
  }
}
