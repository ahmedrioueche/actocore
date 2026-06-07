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
import { randomUUID } from 'crypto';
import type { PayPalConfig } from '../config/paypal.config';
import type { PayPalWebhookPayload } from './paypal-webhook.types';
import { StudioPlanModel } from './schemas/billing.schema';
import { StudioPayPalWebhookDedupService } from './studio-paypal-webhook-dedup.service';
import { StudioPlansService } from './studio-plans.service';
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

type PayPalTokenCache = {
  token: string;
  expiresAt: number;
};

@Injectable()
export class StudioPayPalService {
  private readonly logger = new Logger(StudioPayPalService.name);
  private tokenCache: PayPalTokenCache | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly plans: StudioPlansService,
    @Inject(forwardRef(() => StudioSubscriptionService))
    private readonly subscriptions: StudioSubscriptionService,
    private readonly webhookDedup: StudioPayPalWebhookDedupService,
  ) {}

  private cfg(): PayPalConfig {
    return this.config.getOrThrow<PayPalConfig>('paypal');
  }

  private ensureConfigured(): void {
    const { clientId, clientSecret } = this.cfg();
    if (!clientId || !clientSecret) {
      throw new BadRequestException({
        errorCode: ErrorCode.BILLING_NOT_CONFIGURED,
        message: 'PayPal is not configured',
      });
    }
  }

  async getAccessToken(): Promise<string> {
    this.ensureConfigured();
    const now = Date.now();
    if (this.tokenCache && this.tokenCache.expiresAt > now + 60_000) {
      return this.tokenCache.token;
    }

    const { clientId, clientSecret, apiBaseUrl } = this.cfg();
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );
    const response = await axios.post(
      `${apiBaseUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const token = response.data.access_token as string;
    const expiresIn = Number(response.data.expires_in ?? 3600);
    this.tokenCache = {
      token,
      expiresAt: now + expiresIn * 1000,
    };
    return token;
  }

  private async apiRequest<T>(
    method: 'get' | 'post' | 'patch',
    path: string,
    body?: unknown,
    requestId?: string,
  ): Promise<T> {
    const token = await this.getAccessToken();
    const { apiBaseUrl } = this.cfg();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    if (requestId) {
      headers['PayPal-Request-Id'] = requestId;
    }

    const response = await axios.request<T>({
      method,
      url: `${apiBaseUrl}${path}`,
      headers,
      data: body,
    });
    return response.data;
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

    const { returnUrl, cancelUrl } = this.cfg();
    const payload = {
      plan_id: paypalPlanId,
      custom_id: encodePayPalCustomId({ accountId, planId, billingCycle }),
      application_context: {
        brand_name: 'ActoCore Studio',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    };

    const data = await this.apiRequest<{
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

  async getSubscriptionStatus(subscriptionId: string) {
    const data = await this.fetchSubscription(subscriptionId);
    return {
      id: data.paypalSubscriptionId,
      status: data.status,
      plan_id: data.planId,
    };
  }

  async fetchSubscription(subscriptionId: string): Promise<PayPalSubscriptionData> {
    this.ensureConfigured();
    const data = await this.apiRequest<Record<string, unknown>>(
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
    const response = await this.apiRequest<{
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
    await this.apiRequest(
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
      const result = await this.apiRequest<{ verification_status?: string }>(
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
        break;
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        this.logger.warn(
          `PayPal subscription payment failed: ${String(resource.id ?? '')}`,
        );
        break;
      case 'PAYMENT.SALE.COMPLETED':
        await this.handlePaymentSaleCompleted(resource);
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

  getManageUrl(): string {
    const sandbox = this.cfg().apiBaseUrl.includes('sandbox');
    return sandbox
      ? 'https://www.sandbox.paypal.com/myaccount/autopay/'
      : 'https://www.paypal.com/myaccount/autopay/';
  }
}
