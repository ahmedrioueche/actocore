import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import { randomUUID } from 'crypto';
import type { StudioPlanModel } from './schemas/billing.schema';
import { StudioPayPalHttpService } from './studio-paypal-http.service';
import {
  buildPayPalPlanName,
  formatPayPalAmount,
  getPayPalRegularBillingCycleSequence,
  getPlanCurrencyAmount,
  paidPlanNeedsPayPalSync,
  type PayPalBillingInterval,
} from './utils/studio-paypal-catalog.util';

export type PayPalCatalogSyncResult = {
  skipped: boolean;
  paypalProductId?: string;
  paypalPlanIds?: { monthly?: string; yearly?: string };
};

@Injectable()
export class StudioPayPalCatalogService {
  private readonly logger = new Logger(StudioPayPalCatalogService.name);

  constructor(private readonly paypalHttp: StudioPayPalHttpService) {}

  isConfigured(): boolean {
    return this.paypalHttp.isConfigured();
  }

  /**
   * Ensures PayPal billing plans match Mongo pricing for a studio plan.
   * Creates missing plans or updates pricing on existing PayPal plan IDs.
   */
  async syncPlanCatalog(plan: StudioPlanModel): Promise<PayPalCatalogSyncResult> {
    if (plan.level === 'free') {
      return { skipped: true };
    }

    if (!this.paypalHttp.isConfigured()) {
      this.logger.warn(
        `PayPal not configured — skipped catalog sync for plan ${plan.planId}`,
      );
      return { skipped: true };
    }

    if (!paidPlanNeedsPayPalSync(plan.level, plan.pricing)) {
      return { skipped: true };
    }

    const productId = await this.ensureProduct(plan.paypalProductId);
    const trialDays = plan.trialDays ?? 0;
    const paypalPlanIds = { ...(plan.paypalPlanIds ?? {}) };

    const monthlyAmount = getPlanCurrencyAmount(plan.pricing, 'monthly');
    if (monthlyAmount != null) {
      paypalPlanIds.monthly = await this.ensureBillingPlan({
        existingPayPalPlanId: paypalPlanIds.monthly,
        productId,
        planName: plan.name,
        planId: plan.planId,
        amount: monthlyAmount,
        intervalUnit: 'MONTH',
        trialDays,
      });
    }

    const yearlyAmount = getPlanCurrencyAmount(plan.pricing, 'yearly');
    if (yearlyAmount != null) {
      paypalPlanIds.yearly = await this.ensureBillingPlan({
        existingPayPalPlanId: paypalPlanIds.yearly,
        productId,
        planName: plan.name,
        planId: plan.planId,
        amount: yearlyAmount,
        intervalUnit: 'YEAR',
        trialDays,
      });
    }

    this.logger.log(`Synced PayPal catalog for plan ${plan.planId}`);

    return {
      skipped: false,
      paypalProductId: productId,
      paypalPlanIds,
    };
  }

  private async ensureProduct(existingProductId?: string): Promise<string> {
    const fromEnv = process.env.PAYPAL_PRODUCT_ID?.trim();
    const productId = existingProductId?.trim() || fromEnv;
    if (productId) {
      return productId;
    }

    const data = await this.paypalHttp.billingApiRequest<{ id: string }>(
      'post',
      '/v1/catalogs/products',
      {
        name: 'ActoCore Studio',
        description: 'AI assistant platform for your product',
        type: 'SERVICE',
        category: 'SOFTWARE',
      },
      randomUUID(),
    );

    return data.id;
  }

  private async ensureBillingPlan(input: {
    existingPayPalPlanId?: string;
    productId: string;
    planName: string;
    planId: string;
    amount: number;
    intervalUnit: PayPalBillingInterval;
    trialDays: number;
  }): Promise<string> {
    const { existingPayPalPlanId, trialDays, amount, intervalUnit } = input;

    if (existingPayPalPlanId?.trim()) {
      await this.updateBillingPlanPricing(
        existingPayPalPlanId,
        amount,
        trialDays,
      );
      return existingPayPalPlanId;
    }

    return this.createBillingPlan(input);
  }

  private async createBillingPlan(input: {
    productId: string;
    planName: string;
    planId: string;
    amount: number;
    intervalUnit: PayPalBillingInterval;
    trialDays: number;
  }): Promise<string> {
    const { productId, planName, planId, amount, intervalUnit, trialDays } =
      input;
    const cycle = intervalUnit === 'MONTH' ? 'monthly' : 'yearly';
    const billingCycles: Record<string, unknown>[] = [];
    let sequence = 1;

    if (trialDays > 0) {
      billingCycles.push({
        frequency: { interval_unit: 'DAY', interval_count: trialDays },
        tenure_type: 'TRIAL',
        sequence,
        total_cycles: 1,
        pricing_scheme: {
          fixed_price: { value: '0', currency_code: 'USD' },
        },
      });
      sequence += 1;
    }

    billingCycles.push({
      frequency: {
        interval_unit: intervalUnit,
        interval_count: 1,
      },
      tenure_type: 'REGULAR',
      sequence,
      total_cycles: 0,
      pricing_scheme: {
        fixed_price: {
          value: formatPayPalAmount(amount),
          currency_code: 'USD',
        },
      },
    });

    const data = await this.paypalHttp.billingApiRequest<{
      id: string;
      status?: string;
    }>(
      'post',
      '/v1/billing/plans',
      {
        product_id: productId,
        name: buildPayPalPlanName(planName, planId, cycle),
        description: buildPayPalPlanName(planName, planId, cycle),
        billing_cycles: billingCycles,
        payment_preferences: {
          auto_bill_outstanding: true,
          payment_failure_threshold: 3,
        },
      },
      randomUUID(),
    );

    if (data.status !== 'ACTIVE') {
      await this.activateBillingPlan(data.id);
    }

    return data.id;
  }

  private async activateBillingPlan(paypalPlanId: string): Promise<void> {
    try {
      await this.paypalHttp.billingApiRequest(
        'post',
        `/v1/billing/plans/${paypalPlanId}/activate`,
        {},
      );
    } catch (error) {
      this.logger.warn(
        `PayPal plan ${paypalPlanId} activate skipped (may already be active)`,
      );
    }
  }

  private async updateBillingPlanPricing(
    paypalPlanId: string,
    amount: number,
    trialDays: number,
  ): Promise<void> {
    const sequence = getPayPalRegularBillingCycleSequence(trialDays);

    try {
      await this.paypalHttp.billingApiRequest(
        'post',
        `/v1/billing/plans/${paypalPlanId}/update-pricing-schemes`,
        {
          pricing_schemes: [
            {
              billing_cycle_sequence: sequence,
              pricing_scheme: {
                fixed_price: {
                  value: formatPayPalAmount(amount),
                  currency_code: 'USD',
                },
              },
            },
          ],
        },
        randomUUID(),
      );
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? JSON.stringify(error.response?.data ?? error.message)
        : error instanceof Error
          ? error.message
          : 'PayPal pricing update failed';
      throw new BadRequestException(
        `Failed to update PayPal plan ${paypalPlanId}: ${message}`,
      );
    }
  }
}
