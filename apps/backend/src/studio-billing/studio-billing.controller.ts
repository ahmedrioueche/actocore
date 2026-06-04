import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  apiSuccess,
  CancelSubscriptionDto,
  CreateSubscriptionCheckoutDto,
  ScheduleDowngradeDto,
  StartFreeTrialDto,
  StudioPermission,
  UpgradeSubscriptionDto,
} from '@ahmedrioueche/actocore-shared';
import { StudioPublic } from '../studio/decorators/studio-public.decorator';
import { RequireStudioPermission } from '../studio/decorators/require-studio-permission.decorator';
import { StudioCtx } from '../studio/decorators/studio-context.decorator';
import { StudioAuthGuard } from '../studio/guards/studio-auth.guard';
import { StudioPermissionsGuard } from '../studio/guards/studio-permissions.guard';
import type { StudioRequestContext } from '../studio/studio-context';
import { StudioAccount, StudioAccountDocument } from '../studio/schemas/studio-account.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QuotaService } from '../billing/quota.service';
import { StudioPaddleService } from './studio-paddle.service';
import { StudioPlansService } from './studio-plans.service';
import { StudioSubscriptionService } from './studio-subscription.service';

@UseGuards(StudioAuthGuard, StudioPermissionsGuard)
@Controller('web/billing')
export class StudioBillingController {
  constructor(
    private readonly plans: StudioPlansService,
    private readonly subscriptions: StudioSubscriptionService,
    private readonly paddle: StudioPaddleService,
    private readonly quota: QuotaService,
    @InjectModel(StudioAccount.name)
    private readonly accountModel: Model<StudioAccountDocument>,
  ) {}

  @Get('quota')
  @RequireStudioPermission(StudioPermission.BILLING_READ)
  async getQuota(@StudioCtx() ctx: StudioRequestContext) {
    return apiSuccess(await this.quota.getAccountQuotaStatus(ctx.accountId));
  }

  @StudioPublic()
  @Get('plans')
  async listPlans() {
    return apiSuccess(await this.plans.listPublic());
  }

  @Get('subscription')
  @RequireStudioPermission(StudioPermission.BILLING_READ)
  async getSubscription(@StudioCtx() ctx: StudioRequestContext) {
    return apiSuccess(await this.subscriptions.getSummary(ctx.accountId));
  }

  @Get('trial/eligibility')
  @RequireStudioPermission(StudioPermission.BILLING_READ)
  async getTrialEligibility(
    @StudioCtx() ctx: StudioRequestContext,
    @Query('planId') planId?: string,
  ) {
    if (!planId?.trim()) {
      throw new BadRequestException('planId query parameter is required');
    }
    return apiSuccess(
      await this.subscriptions.getTrialEligibility(ctx.accountId, planId.trim()),
    );
  }

  @Post('trial/start')
  @RequireStudioPermission(StudioPermission.BILLING_WRITE)
  async startFreeTrial(
    @StudioCtx() ctx: StudioRequestContext,
    @Body() body: StartFreeTrialDto,
  ) {
    return apiSuccess(
      await this.subscriptions.startFreeTrial(
        ctx.accountId,
        body.planId,
        body.billingCycle ?? 'monthly',
      ),
    );
  }

  @Get('payments')
  @RequireStudioPermission(StudioPermission.BILLING_READ)
  async listPayments(@StudioCtx() ctx: StudioRequestContext) {
    return apiSuccess(
      await this.subscriptions.listPaymentHistory(ctx.accountId),
    );
  }

  @Post('paddle/checkout')
  @RequireStudioPermission(StudioPermission.BILLING_WRITE)
  async createCheckout(
    @StudioCtx() ctx: StudioRequestContext,
    @Body() body: CreateSubscriptionCheckoutDto,
  ) {
    const account = await this.accountModel.findById(ctx.accountId).exec();
    const result = await this.paddle.createSubscriptionCheckout(
      ctx.accountId,
      body.planId,
      body.billingCycle ?? 'monthly',
      account?.paddleCustomerId,
    );
    return apiSuccess(result);
  }

  @Get('paddle/transaction/:transactionId')
  @RequireStudioPermission(StudioPermission.BILLING_WRITE)
  async getTransaction(@Param('transactionId') transactionId: string) {
    return apiSuccess(await this.paddle.getTransactionStatus(transactionId));
  }

  @Post('subscription/cancel')
  @RequireStudioPermission(StudioPermission.BILLING_WRITE)
  async cancel(
    @StudioCtx() ctx: StudioRequestContext,
    @Body() body: CancelSubscriptionDto,
  ) {
    return apiSuccess(
      await this.subscriptions.cancelSubscription(ctx.accountId, body.reason),
    );
  }

  @Post('subscription/reactivate')
  @RequireStudioPermission(StudioPermission.BILLING_WRITE)
  async reactivate(@StudioCtx() ctx: StudioRequestContext) {
    return apiSuccess(
      await this.subscriptions.reactivateSubscription(ctx.accountId),
    );
  }

  @Post('subscription/upgrade/preview')
  @RequireStudioPermission(StudioPermission.BILLING_WRITE)
  async previewUpgrade(
    @StudioCtx() ctx: StudioRequestContext,
    @Body() body: UpgradeSubscriptionDto,
  ) {
    return apiSuccess(
      await this.subscriptions.previewUpgrade(
        ctx.accountId,
        body.planId,
        body.billingCycle ?? 'monthly',
      ),
    );
  }

  @Post('subscription/upgrade')
  @RequireStudioPermission(StudioPermission.BILLING_WRITE)
  async applyUpgrade(
    @StudioCtx() ctx: StudioRequestContext,
    @Body() body: UpgradeSubscriptionDto,
  ) {
    return apiSuccess(
      await this.subscriptions.applyUpgrade(
        ctx.accountId,
        body.planId,
        body.billingCycle ?? 'monthly',
      ),
    );
  }

  @Post('paddle/customer-portal')
  @RequireStudioPermission(StudioPermission.BILLING_READ)
  async customerPortal(@StudioCtx() ctx: StudioRequestContext) {
    return apiSuccess(await this.subscriptions.createCustomerPortal(ctx.accountId));
  }

  @Post('subscription/downgrade')
  @RequireStudioPermission(StudioPermission.BILLING_WRITE)
  async scheduleDowngrade(
    @StudioCtx() ctx: StudioRequestContext,
    @Body() body: ScheduleDowngradeDto,
  ) {
    return apiSuccess(
      await this.subscriptions.scheduleDowngrade(
        ctx.accountId,
        body.planId,
        body.billingCycle ?? 'monthly',
      ),
    );
  }

  @Post('subscription/cancel-pending-change')
  @RequireStudioPermission(StudioPermission.BILLING_WRITE)
  async cancelPendingChange(@StudioCtx() ctx: StudioRequestContext) {
    return apiSuccess(
      await this.subscriptions.cancelPendingChange(ctx.accountId),
    );
  }
}
