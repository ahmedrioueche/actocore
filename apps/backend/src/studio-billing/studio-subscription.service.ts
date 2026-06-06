import {
  DEFAULT_CURRENCY,
  ErrorCode,
  type AppPaymentProvider,
  type AppSubscriptionBillingCycle,
  type Paginated,
  type PaginationQuery,
  type StudioBillingHistoryEntry,
  type StudioCustomerPortalData,
  type StudioPlan,
  type StudioSubscription,
  type StudioTrialEligibility,
  type StudioUpgradePreviewData,
  type SupportedCurrency,
} from '@ahmedrioueche/actocore-shared';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import {
  normalizePagination,
  paginate,
} from '../common/pagination/pagination.util';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import {
  StudioMembership,
  StudioMembershipDocument,
} from '../studio/schemas/studio-membership.schema';
import {
  StudioAccount,
  StudioAccountDocument,
} from '../studio/schemas/studio-account.schema';
import { UsageService } from '../usage/usage.service';
import {
  StudioPlanModel,
  StudioSubscriptionHistoryModel,
  StudioSubscriptionModel,
} from './schemas/billing.schema';
import { StudioPaddleService, type PaddleSubscriptionData } from './studio-paddle.service';
import { StudioPlansService } from './studio-plans.service';
import { isDowngrade, isUpgrade } from './utils/plan-level.util';
import { isMongoDuplicateKeyError } from './utils/mongo-duplicate.util';
import { calculateSubscriptionDates } from './utils/subscription-dates.util';
import { evaluateTrialEligibility } from './utils/studio-trial.util';

export type SubscribeOptions = {
  provider?: AppPaymentProvider;
  /** Subscription is paid/active (skip local trial even if eligible). */
  paymentCollected?: boolean;
};

@Injectable()
export class StudioSubscriptionService {
  private readonly logger = new Logger(StudioSubscriptionService.name);

  constructor(
    @InjectModel(StudioSubscriptionModel.name)
    private readonly subscriptionModel: Model<StudioSubscriptionModel>,
    @InjectModel(StudioSubscriptionHistoryModel.name)
    private readonly historyModel: Model<StudioSubscriptionHistoryModel>,
    @InjectModel(StudioPlanModel.name)
    private readonly planModel: Model<StudioPlanModel>,
    @InjectModel(StudioAccount.name)
    private readonly accountModel: Model<StudioAccountDocument>,
    @InjectModel(StudioMembership.name)
    private readonly membershipModel: Model<StudioMembershipDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly plans: StudioPlansService,
    private readonly usage: UsageService,
    @Inject(forwardRef(() => StudioPaddleService))
    private readonly paddle: StudioPaddleService,
  ) {}

  async getAccountSubscription(accountId: string): Promise<StudioSubscription | null> {
    await this.expireEndedTrials(accountId);
    const sub = await this.subscriptionModel
      .findOne({
        accountId: new Types.ObjectId(accountId),
        status: { $in: ['active', 'trialing'] },
      })
      .sort({ createdAt: -1 })
      .exec();

    if (!sub) {
      return null;
    }

    const planDoc = await this.planModel.findOne({ planId: sub.planId }).exec();
    return this.toSubscription(sub, planDoc ? this.plans.toPlan(planDoc) : null);
  }

  async getSummary(accountId: string) {
    await this.expireEndedTrials(accountId);
    const subscription = await this.getAccountSubscription(accountId);
    let limits: StudioPlan['limits'] = subscription?.plan?.limits ?? {};
    if (!subscription) {
      const free = await this.planModel
        .findOne({ level: 'free', isActive: { $ne: false } })
        .exec();
      limits = free?.limits ?? {};
    }

    const [projectsUsed, teamSeatsUsed] = await Promise.all([
      this.projectModel.countDocuments({ accountId }).exec(),
      this.membershipModel
        .countDocuments({ accountId: new Types.ObjectId(accountId) })
        .exec(),
    ]);

    const projects = await this.projectModel
      .find({ accountId })
      .select('_id')
      .exec();
    const monthlyChatUsed = await this.usage.countChatRequestsThisMonthForAccount(
      accountId,
      projects.map((p) => p._id.toString()),
    );

    return {
      subscription,
      limits: limits as StudioPlan['limits'],
      usage: {
        projectsUsed,
        teamSeatsUsed,
        monthlyChatUsed,
      },
      trial: await this.buildTrialStatus(accountId, subscription),
    };
  }

  async getTrialEligibility(
    accountId: string,
    planId: string,
  ): Promise<StudioTrialEligibility> {
    const plan = await this.plans.getByPlanId(planId);
    const evaluated = evaluateTrialEligibility({
      planLevel: plan.level,
      planTrialDays: plan.trialDays ?? 0,
      planIsActive: plan.isActive !== false,
      hasUsedTrial: await this.hasUsedTrial(accountId),
      hasActiveSubscription: await this.hasActiveSubscription(accountId),
    });
    return {
      planId,
      eligible: evaluated.eligible,
      trialDays: evaluated.trialDays,
      reason: evaluated.reason,
      message: evaluated.message,
    };
  }

  async startFreeTrial(
    accountId: string,
    planId: string,
    billingCycle: AppSubscriptionBillingCycle = 'monthly',
  ): Promise<StudioSubscription> {
    const eligibility = await this.getTrialEligibility(accountId, planId);
    if (!eligibility.eligible) {
      throw new BadRequestException({
        errorCode: ErrorCode.TRIAL_NOT_ELIGIBLE,
        message: eligibility.message ?? 'Not eligible for a free trial',
      });
    }
    return this.subscribe(
      accountId,
      planId,
      billingCycle,
      DEFAULT_CURRENCY,
      undefined,
      undefined,
      { provider: 'internal', paymentCollected: false },
    );
  }

  async expireEndedTrials(accountId: string): Promise<number> {
    const now = new Date();
    const trialing = await this.subscriptionModel
      .find({
        accountId: new Types.ObjectId(accountId),
        status: 'trialing',
      })
      .exec();

    let expired = 0;
    for (const sub of trialing) {
      const trialEnd = sub.trial?.endDate ?? sub.currentPeriodEnd;
      if (trialEnd >= now) {
        continue;
      }
      sub.status = 'expired';
      sub.endDate = trialEnd;
      sub.autoRenew = false;
      sub.cancelAtPeriodEnd = false;
      await sub.save();
      await this.recordHistory(sub, 'expired', 'Free trial ended');
      expired += 1;
    }
    return expired;
  }

  async subscribe(
    accountId: string,
    planId: string,
    billingCycle: AppSubscriptionBillingCycle = 'monthly',
    currency: SupportedCurrency = DEFAULT_CURRENCY,
    paddleSubscriptionId?: string,
    paddleCustomerId?: string,
    options?: SubscribeOptions,
  ): Promise<StudioSubscription> {
    const account = await this.accountModel.findById(accountId).exec();
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const plan = await this.plans.getByPlanId(planId);
    if (!plan.isActive) {
      throw new BadRequestException('Plan is not active');
    }

    if (paddleSubscriptionId) {
      const existing = await this.subscriptionModel
        .findOne({ paddleSubscriptionId })
        .exec();
      if (existing) {
        existing.planId = planId;
        existing.billingCycle = billingCycle;
        if (options?.paymentCollected) {
          existing.status = 'active';
          this.markTrialConverted(existing);
        }
        existing.cancelAtPeriodEnd = false;
        existing.cancelledAt = undefined;
        await existing.save();
        return this.toSubscription(existing, this.plans.toPlan(plan));
      }
    }

    await this.subscriptionModel.updateMany(
      {
        accountId: new Types.ObjectId(accountId),
        status: { $in: ['active', 'trialing'] },
      },
      { status: 'cancelled', endDate: new Date() },
    );

    const now = new Date();
    const priorTrial = await this.hasUsedTrial(accountId);

    const trialDays = plan.trialDays ?? 0;
    const startTrial =
      !options?.paymentCollected &&
      trialDays > 0 &&
      !priorTrial &&
      plan.level !== 'free';

    let status: 'active' | 'trialing' = 'active';
    let trial: {
      startDate: Date;
      endDate: Date;
      hasUsedTrial: boolean;
    } | undefined;

    let periodEnd: Date;
    if (startTrial) {
      periodEnd = new Date(now.getTime() + trialDays * 86_400_000);
      status = 'trialing';
      trial = {
        startDate: now,
        endDate: periodEnd,
        hasUsedTrial: true,
      };
    } else {
      periodEnd = calculateSubscriptionDates(now, billingCycle).currentPeriodEnd;
    }

    const { nextPaymentDate, endDate } = calculateSubscriptionDates(
      now,
      billingCycle,
    );

    let sub: StudioSubscriptionModel;
    try {
      sub = await this.subscriptionModel.create({
        accountId: new Types.ObjectId(accountId),
        planId: plan.planId,
        startDate: now,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        status,
        trial,
        lastPaymentDate: now,
        autoRenew: true,
        billingCycle,
        provider: options?.provider ?? (paddleSubscriptionId ? 'paddle' : 'internal'),
        paddleSubscriptionId,
        paddleCustomerId,
        endDate: startTrial ? periodEnd : endDate,
        nextPaymentDate: startTrial ? periodEnd : nextPaymentDate,
        createdAt: now,
      });
    } catch (error) {
      if (paddleSubscriptionId && isMongoDuplicateKeyError(error)) {
        const existing = await this.subscriptionModel
          .findOne({ paddleSubscriptionId })
          .exec();
        if (existing) {
          return this.toSubscription(existing, this.plans.toPlan(plan));
        }
      }
      throw error;
    }

    if (paddleCustomerId) {
      account.paddleCustomerId = paddleCustomerId;
      await account.save();
    }

    const historyDetail = startTrial
      ? `Started ${trialDays}-day free trial on ${plan.name}`
      : `Subscribed to ${plan.name}`;
    await this.recordHistory(sub, 'created', historyDetail);
    return this.toSubscription(sub, this.plans.toPlan(plan));
  }

  async handlePaddleTransactionCompleted(data: {
    transactionId: string;
    paddleSubscriptionId: string;
    customData?: {
      accountId?: string;
      planId?: string;
      billingCycle?: AppSubscriptionBillingCycle;
    };
    paddleCustomerId?: string;
    currency?: string;
    amountPaid?: number;
  }): Promise<void> {
    if (data.transactionId) {
      const paymentSeen = await this.historyModel
        .exists({ providerTransactionId: data.transactionId })
        .exec();
      if (paymentSeen) {
        this.logger.debug(
          `Skipping duplicate Paddle transaction ${data.transactionId}`,
        );
        return;
      }
    }

    const accountId = data.customData?.accountId;
    const planId = data.customData?.planId;
    if (!accountId || !planId) {
      this.logger.error(
        `Webhook missing accountId/planId for txn ${data.transactionId}`,
      );
      return;
    }

    let doc = await this.subscriptionModel
      .findOne({ paddleSubscriptionId: data.paddleSubscriptionId })
      .exec();

    if (!doc) {
      await this.subscribe(
        accountId,
        planId,
        data.customData?.billingCycle ?? 'monthly',
        (data.currency as SupportedCurrency) || DEFAULT_CURRENCY,
        data.paddleSubscriptionId,
        data.paddleCustomerId,
        {
          provider: 'paddle',
          paymentCollected: (data.amountPaid ?? 0) > 0,
        },
      );
      doc = await this.subscriptionModel
        .findOne({ paddleSubscriptionId: data.paddleSubscriptionId })
        .exec();
    }

    if (!doc) {
      this.logger.error(
        `Failed to resolve subscription after txn ${data.transactionId}`,
      );
      return;
    }

    if (data.amountPaid != null && data.amountPaid > 0 && data.transactionId) {
      if (doc.status === 'trialing') {
        this.markTrialConverted(doc);
        doc.status = 'active';
        await doc.save();
      }
      await this.recordHistory(doc, 'renewed', 'Trial converted to paid', {
        amountPaid: data.amountPaid,
        currency: (data.currency as SupportedCurrency) || DEFAULT_CURRENCY,
        providerTransactionId: data.transactionId,
      });
    }
  }

  async syncFromPaddleData(paddleData: PaddleSubscriptionData): Promise<void> {
    const sub = await this.subscriptionModel
      .findOne({ paddleSubscriptionId: paddleData.paddleSubscriptionId })
      .exec();
    if (!sub) {
      this.logger.warn(`No local sub for paddle ${paddleData.paddleSubscriptionId}`);
      return;
    }

    if (paddleData.status === 'active' || paddleData.status === 'trialing') {
      const wasTrialing = sub.status === 'trialing';
      sub.status = paddleData.status === 'trialing' ? 'trialing' : 'active';
      if (sub.status === 'trialing' && !sub.trial) {
        const trialEnd = paddleData.currentPeriodEnd ?? sub.currentPeriodEnd;
        sub.trial = {
          startDate: paddleData.currentPeriodStart ?? sub.currentPeriodStart,
          endDate: trialEnd,
          hasUsedTrial: true,
        };
      }
      if (wasTrialing && sub.status === 'active') {
        this.markTrialConverted(sub);
      }
    } else if (paddleData.status === 'canceled') {
      sub.status = 'cancelled';
    }

    if (paddleData.currentPeriodStart) {
      sub.currentPeriodStart = paddleData.currentPeriodStart;
    }
    if (paddleData.currentPeriodEnd) {
      sub.currentPeriodEnd = paddleData.currentPeriodEnd;
      if (sub.status === 'active') {
        sub.endDate = paddleData.currentPeriodEnd;
      }
    }
    if (paddleData.nextPaymentDate) {
      sub.nextPaymentDate = paddleData.nextPaymentDate;
    }

    sub.cancelAtPeriodEnd = paddleData.cancelAtPeriodEnd ?? false;
    sub.autoRenew = !sub.cancelAtPeriodEnd;

    if (
      sub.pendingPlanId &&
      sub.pendingChangeEffectiveDate &&
      new Date() >= sub.pendingChangeEffectiveDate
    ) {
      sub.planId = sub.pendingPlanId;
      if (sub.pendingBillingCycle) {
        sub.billingCycle = sub.pendingBillingCycle;
      }
      sub.pendingPlanId = undefined;
      sub.pendingBillingCycle = undefined;
      sub.pendingChangeEffectiveDate = undefined;
    } else if (paddleData.priceId) {
      const plan = await this.plans.findByPaddlePriceId(paddleData.priceId);
      if (plan && !sub.pendingPlanId) {
        sub.planId = plan.planId;
        if (paddleData.billingCycle) {
          sub.billingCycle = paddleData.billingCycle;
        }
      }
    }

    await sub.save();
  }

  async previewUpgrade(
    accountId: string,
    targetPlanId: string,
    billingCycle: AppSubscriptionBillingCycle = 'monthly',
  ): Promise<StudioUpgradePreviewData> {
    const sub = await this.requireActivePaidSubscription(accountId);
    const currentPlan = await this.plans.getByPlanId(sub.planId);
    const targetPlan = await this.plans.getByPlanId(targetPlanId);

    if (targetPlan.level === 'free') {
      throw new BadRequestException('Use cancel or downgrade for the free plan');
    }
    if (!isUpgrade(currentPlan.level, targetPlan.level)) {
      throw new BadRequestException(
        'Target plan is not a higher tier. Use downgrade for lower tiers.',
      );
    }

    const priceId = this.paddle.getPaddlePriceId(targetPlan, billingCycle);
    if (!priceId || !sub.paddleSubscriptionId) {
      throw new BadRequestException(
        'Paid upgrade preview requires an active Paddle subscription',
      );
    }

    const preview = await this.paddle.previewSubscriptionUpgrade(
      sub.paddleSubscriptionId,
      priceId,
    );

    return this.mapUpgradePreview(targetPlanId, billingCycle, preview);
  }

  async applyUpgrade(
    accountId: string,
    targetPlanId: string,
    billingCycle: AppSubscriptionBillingCycle = 'monthly',
  ): Promise<StudioSubscription> {
    const sub = await this.requireActivePaidSubscription(accountId);
    const currentPlan = await this.plans.getByPlanId(sub.planId);
    const targetPlan = await this.plans.getByPlanId(targetPlanId);

    if (targetPlan.level === 'free') {
      throw new BadRequestException('Use cancel or downgrade for the free plan');
    }
    if (!isUpgrade(currentPlan.level, targetPlan.level)) {
      throw new BadRequestException(
        'Target plan is not a higher tier. Use downgrade for lower tiers.',
      );
    }

    const priceId = this.paddle.getPaddlePriceId(targetPlan, billingCycle);
    if (!priceId || !sub.paddleSubscriptionId) {
      throw new BadRequestException(
        'Immediate upgrade requires an active Paddle subscription. Use checkout instead.',
      );
    }

    const paddleData = await this.paddle.upgradeSubscriptionImmediately(
      sub.paddleSubscriptionId,
      priceId,
    );

    await this.syncFromPaddleData(paddleData);

    const refreshed = await this.subscriptionModel.findById(sub._id).exec();
    if (!refreshed) {
      throw new NotFoundException('Subscription not found after upgrade');
    }

    refreshed.planId = targetPlanId;
    refreshed.billingCycle = billingCycle;
    refreshed.pendingPlanId = undefined;
    refreshed.pendingBillingCycle = undefined;
    refreshed.pendingChangeEffectiveDate = undefined;
    await refreshed.save();

    await this.recordHistory(
      refreshed,
      'upgraded',
      `Upgraded to ${targetPlan.name} (${billingCycle})`,
    );

    return this.toSubscription(refreshed, this.plans.toPlan(targetPlan));
  }

  async createCustomerPortal(accountId: string): Promise<StudioCustomerPortalData> {
    const account = await this.accountModel.findById(accountId).exec();
    if (!account?.paddleCustomerId) {
      throw new BadRequestException(
        'No billing customer on file. Complete checkout first.',
      );
    }

    const sub = await this.subscriptionModel
      .findOne({
        accountId: new Types.ObjectId(accountId),
        status: { $in: ['active', 'trialing'] },
      })
      .exec();

    const session = await this.paddle.createCustomerPortalSession(
      account.paddleCustomerId,
      sub?.paddleSubscriptionId ? [sub.paddleSubscriptionId] : undefined,
    );

    return {
      portalUrl: session.portalUrl,
      subscriptionPortalUrl: session.subscriptionPortalUrl,
    };
  }

  async scheduleDowngrade(
    accountId: string,
    targetPlanId: string,
    billingCycle: AppSubscriptionBillingCycle = 'monthly',
  ): Promise<StudioSubscription> {
    const sub = await this.subscriptionModel
      .findOne({
        accountId: new Types.ObjectId(accountId),
        status: { $in: ['active', 'trialing'] },
      })
      .exec();
    if (!sub) {
      throw new NotFoundException('No active subscription found');
    }

    const currentPlan = await this.plans.getByPlanId(sub.planId);
    const targetPlan = await this.plans.getByPlanId(targetPlanId);

    if (!isDowngrade(currentPlan.level, targetPlan.level)) {
      throw new BadRequestException(
        'Target plan is not a lower tier. Use checkout to upgrade.',
      );
    }

    const priceId = this.paddle.getPaddlePriceId(targetPlan, billingCycle);
    if (!priceId) {
      throw new BadRequestException('Paddle price not configured for target plan');
    }

    sub.pendingPlanId = targetPlanId;
    sub.pendingBillingCycle = billingCycle;
    sub.pendingChangeEffectiveDate = sub.currentPeriodEnd;
    await sub.save();

    if (sub.paddleSubscriptionId) {
      await this.paddle.schedulePlanChangeAtPeriodEnd(
        sub.paddleSubscriptionId,
        priceId,
      );
    }

    await this.recordHistory(
      sub,
      'downgrade_scheduled',
      `Scheduled downgrade to ${targetPlan.name} at period end`,
    );

    const plan = this.plans.toPlan(targetPlan);
    return this.toSubscription(sub, plan);
  }

  async cancelPendingChange(accountId: string): Promise<StudioSubscription> {
    const sub = await this.subscriptionModel
      .findOne({
        accountId: new Types.ObjectId(accountId),
        status: { $in: ['active', 'trialing'] },
      })
      .exec();
    if (!sub?.pendingPlanId) {
      throw new BadRequestException('No pending plan change');
    }

    const currentPlan = await this.plans.getByPlanId(sub.planId);
    const priceId = this.paddle.getPaddlePriceId(
      currentPlan,
      sub.billingCycle ?? 'monthly',
    );

    sub.pendingPlanId = undefined;
    sub.pendingBillingCycle = undefined;
    sub.pendingChangeEffectiveDate = undefined;
    await sub.save();

    if (sub.paddleSubscriptionId && priceId) {
      await this.paddle.clearScheduledPlanChange(
        sub.paddleSubscriptionId,
        priceId,
      );
    }

    await this.recordHistory(sub, 'pending_change_cancelled', 'Cancelled pending change');
    return this.toSubscription(sub, this.plans.toPlan(currentPlan));
  }

  async listPaymentHistory(
    accountId: string,
  ): Promise<StudioBillingHistoryEntry[]> {
    const rows = await this.historyModel
      .find({ accountId: new Types.ObjectId(accountId) })
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();

    return rows.map((row) => this.toHistoryEntry(row));
  }

  /** Paginated variant used by the Studio billing history route. */
  async listPaymentHistoryPaginated(
    accountId: string,
    query: PaginationQuery = {},
  ): Promise<Paginated<StudioBillingHistoryEntry>> {
    const { page, limit, skip } = normalizePagination(query);
    const filter = { accountId: new Types.ObjectId(accountId) };

    const [rows, total] = await Promise.all([
      this.historyModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.historyModel.countDocuments(filter).exec(),
    ]);

    return paginate(
      rows.map((row) => this.toHistoryEntry(row)),
      total,
      { page, limit },
    );
  }

  private toHistoryEntry(
    row: HydratedDocument<StudioSubscriptionHistoryModel>,
  ): StudioBillingHistoryEntry {
    return {
      id: row._id.toString(),
      accountId: row.accountId.toString(),
      subscriptionId: row.subscriptionId.toString(),
      planId: row.planId,
      action: row.action,
      status: row.status,
      amountPaid: row.amountPaid,
      currency: row.currency,
      details: row.details,
      createdAt: (row.createdAt ?? new Date()).toISOString(),
    };
  }

  async cancelSubscription(
    accountId: string,
    reason?: string,
  ): Promise<StudioSubscription> {
    const sub = await this.subscriptionModel
      .findOne({
        accountId: new Types.ObjectId(accountId),
        status: { $in: ['active', 'trialing'] },
      })
      .exec();

    if (!sub) {
      throw new NotFoundException('No active subscription found');
    }

    if (sub.provider === 'paddle' && sub.paddleSubscriptionId) {
      const paddleData = await this.paddle.cancelSubscription(
        sub.paddleSubscriptionId,
      );
      await this.syncFromPaddleData(paddleData);
    } else {
      sub.cancelAtPeriodEnd = true;
      sub.autoRenew = false;
      sub.cancelledAt = new Date().toISOString();
      sub.cancellationReason = reason;
      sub.endDate = sub.currentPeriodEnd;
      await sub.save();
    }

    const updated = await this.subscriptionModel.findById(sub._id).exec();
    if (!updated) {
      throw new NotFoundException('Subscription not found after cancel');
    }
    if (updated.cancellationReason !== reason && reason) {
      updated.cancellationReason = reason;
      await updated.save();
    }

    await this.recordHistory(updated, 'cancelled', reason);
    const plan = await this.planModel.findOne({ planId: updated.planId }).exec();
    return this.toSubscription(
      updated,
      plan ? this.plans.toPlan(plan) : null,
    );
  }

  async reactivateSubscription(accountId: string): Promise<StudioSubscription> {
    const sub = await this.subscriptionModel
      .findOne({
        accountId: new Types.ObjectId(accountId),
        status: { $in: ['active', 'trialing', 'cancelled'] },
      })
      .sort({ createdAt: -1 })
      .exec();

    if (!sub?.paddleSubscriptionId) {
      throw new BadRequestException('No Paddle subscription to reactivate');
    }

    const paddleData = await this.paddle.reactivateSubscription(
      sub.paddleSubscriptionId,
    );
    await this.syncFromPaddleData(paddleData);

    const updated = await this.subscriptionModel.findById(sub._id).exec();
    await this.recordHistory(updated!, 'reactivated', 'Reactivated via Paddle');
    const plan = await this.planModel.findOne({ planId: updated!.planId }).exec();
    return this.toSubscription(
      updated!,
      plan ? this.plans.toPlan(plan) : null,
    );
  }

  private async hasUsedTrial(accountId: string): Promise<boolean> {
    return Boolean(
      await this.subscriptionModel.exists({
        accountId: new Types.ObjectId(accountId),
        'trial.hasUsedTrial': true,
      }),
    );
  }

  private async hasActiveSubscription(accountId: string): Promise<boolean> {
    return Boolean(
      await this.subscriptionModel.exists({
        accountId: new Types.ObjectId(accountId),
        status: { $in: ['active', 'trialing'] },
      }),
    );
  }

  private async buildTrialStatus(
    accountId: string,
    subscription: StudioSubscription | null,
  ) {
    const hasUsedTrial = await this.hasUsedTrial(accountId);
    const isTrialing = subscription?.status === 'trialing';
    const trialEndsAt = subscription?.trial?.endDate;
    let daysRemaining: number | undefined;
    if (isTrialing && trialEndsAt) {
      const ms = new Date(trialEndsAt).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(ms / 86_400_000));
    }
    return {
      hasUsedTrial,
      isTrialing,
      trialEndsAt,
      daysRemaining,
    };
  }

  private markTrialConverted(sub: StudioSubscriptionModel): void {
    if (!sub.trial) {
      return;
    }
    sub.trial.convertedToPaid = true;
  }

  private async recordHistory(
    sub: StudioSubscriptionModel | null,
    action: string,
    details?: string,
    payment?: {
      amountPaid?: number;
      currency?: SupportedCurrency;
      providerTransactionId?: string;
    },
  ): Promise<boolean> {
    if (!sub) {
      return false;
    }

    if (payment?.providerTransactionId) {
      const exists = await this.historyModel
        .exists({ providerTransactionId: payment.providerTransactionId })
        .exec();
      if (exists) {
        return false;
      }
    }

    try {
      await this.historyModel.create({
        accountId: sub.accountId,
        subscriptionId: sub._id,
        planId: sub.planId,
        action,
        startDate: sub.currentPeriodStart,
        endDate: sub.currentPeriodEnd,
        status: sub.status,
        details,
        amountPaid: payment?.amountPaid,
        currency: payment?.currency,
        providerTransactionId: payment?.providerTransactionId,
        createdAt: new Date(),
      });
      return true;
    } catch (error) {
      if (payment?.providerTransactionId && isMongoDuplicateKeyError(error)) {
        return false;
      }
      throw error;
    }
  }

  private toSubscription(
    doc: StudioSubscriptionModel,
    plan: StudioPlan | null,
  ): StudioSubscription {
    return {
      id: doc._id.toString(),
      accountId: doc.accountId.toString(),
      planId: doc.planId,
      plan,
      startDate: doc.startDate.toISOString(),
      endDate: doc.endDate?.toISOString(),
      currentPeriodStart: doc.currentPeriodStart.toISOString(),
      currentPeriodEnd: doc.currentPeriodEnd.toISOString(),
      status: doc.status,
      autoRenew: doc.autoRenew,
      billingCycle: doc.billingCycle,
      lastPaymentDate: doc.lastPaymentDate?.toISOString(),
      nextPaymentDate: doc.nextPaymentDate?.toISOString(),
      trial: doc.trial
        ? {
            startDate: doc.trial.startDate.toISOString(),
            endDate: doc.trial.endDate.toISOString(),
            hasUsedTrial: doc.trial.hasUsedTrial,
            convertedToPaid: doc.trial.convertedToPaid,
          }
        : undefined,
      cancelledAt: doc.cancelledAt,
      cancelAtPeriodEnd: doc.cancelAtPeriodEnd,
      cancellationReason: doc.cancellationReason,
      pendingPlanId: doc.pendingPlanId,
      pendingBillingCycle: doc.pendingBillingCycle,
      pendingChangeEffectiveDate: doc.pendingChangeEffectiveDate?.toISOString(),
      provider: doc.provider,
      paddleSubscriptionId: doc.paddleSubscriptionId,
      paddleCustomerId: doc.paddleCustomerId,
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
      updatedAt: doc.updatedAt?.toISOString(),
    };
  }

  private async requireActivePaidSubscription(
    accountId: string,
  ): Promise<StudioSubscriptionModel> {
    const sub = await this.subscriptionModel
      .findOne({
        accountId: new Types.ObjectId(accountId),
        status: { $in: ['active', 'trialing'] },
      })
      .exec();
    if (!sub) {
      throw new NotFoundException('No active subscription found');
    }
    if (sub.provider !== 'paddle' || !sub.paddleSubscriptionId) {
      throw new BadRequestException(
        'Plan changes via Paddle require an active paid Paddle subscription',
      );
    }
    return sub;
  }

  private mapUpgradePreview(
    targetPlanId: string,
    billingCycle: AppSubscriptionBillingCycle,
    paddlePreview: Record<string, unknown>,
  ): StudioUpgradePreviewData {
    const immediate = paddlePreview.immediate_transaction as
      | {
          details?: {
            totals?: { total?: string; currency_code?: string };
            adjusted_totals?: { total?: string };
          };
        }
      | null
      | undefined;
    const next = paddlePreview.next_transaction as
      | { details?: { totals?: { total?: string } } }
      | null
      | undefined;

    const totals = immediate?.details?.totals;
    return {
      targetPlanId,
      billingCycle,
      prorationBillingMode: 'prorated_immediately',
      currencyCode: totals?.currency_code,
      immediateTotal:
        totals?.total ?? immediate?.details?.adjusted_totals?.total,
      nextBillingTotal: next?.details?.totals?.total,
    };
  }
}
