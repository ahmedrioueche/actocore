import {
  DEFAULT_CURRENCY,
  ErrorCode,
  type AppPaymentProvider,
  type AppSubscriptionBillingCycle,
  type Paginated,
  type PaginationQuery,
  type StudioBillingHistoryEntry,
  type StudioPlan,
  type StudioSubscription,
  type StudioTrialEligibility,
  type StudioUpgradeResult,
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
import {
  StudioPayPalService,
  type PayPalSubscriptionData,
} from './studio-paypal.service';
import { StudioPlansService } from './studio-plans.service';
import { decodePayPalCustomId } from './utils/paypal-custom-id.util';
import { isUpgrade } from './utils/plan-level.util';
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
    @Inject(forwardRef(() => StudioPayPalService))
    private readonly paypal: StudioPayPalService,
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

  async findAccountIdByPayPalSubscription(
    paypalSubscriptionId: string,
  ): Promise<string | null> {
    const sub = await this.subscriptionModel
      .findOne({ paypalSubscriptionId })
      .select('accountId')
      .exec();
    return sub?.accountId?.toString() ?? null;
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
      await this.recordHistory(sub, 'trial_ended');
      expired += 1;
    }
    return expired;
  }

  async subscribe(
    accountId: string,
    planId: string,
    billingCycle: AppSubscriptionBillingCycle = 'monthly',
    currency: SupportedCurrency = DEFAULT_CURRENCY,
    paypalSubscriptionId?: string,
    paypalPayerId?: string,
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

    if (paypalSubscriptionId) {
      const existing = await this.subscriptionModel
        .findOne({ paypalSubscriptionId })
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
      plan.level === 'free';

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
        provider: options?.provider ?? (paypalSubscriptionId ? 'paypal' : 'internal'),
        paypalSubscriptionId,
        paypalPayerId,
        endDate: startTrial ? periodEnd : endDate,
        nextPaymentDate: startTrial ? periodEnd : nextPaymentDate,
        createdAt: now,
      });
    } catch (error) {
      if (paypalSubscriptionId && isMongoDuplicateKeyError(error)) {
        const existing = await this.subscriptionModel
          .findOne({ paypalSubscriptionId })
          .exec();
        if (existing) {
          return this.toSubscription(existing, this.plans.toPlan(plan));
        }
      }
      throw error;
    }

    if (paypalPayerId) {
      account.paypalPayerId = paypalPayerId;
      await account.save();
    }

    if (startTrial) {
      await this.recordHistory(sub, 'trial_started', String(trialDays));
    } else {
      await this.recordHistory(sub, 'subscribed', plan.name);
    }
    return this.toSubscription(sub, this.plans.toPlan(plan));
  }

  async activateFromPayPalWebhook(
    paypalData: PayPalSubscriptionData,
    customId?: string,
  ): Promise<void> {
    const custom = decodePayPalCustomId(customId);
    const accountId = custom?.accountId;
    const planId = custom?.planId;
    if (!accountId || !planId) {
      this.logger.error(
        `PayPal webhook missing accountId/planId for sub ${paypalData.paypalSubscriptionId}`,
      );
      return;
    }

    let doc = await this.subscriptionModel
      .findOne({ paypalSubscriptionId: paypalData.paypalSubscriptionId })
      .exec();

    if (!doc) {
      await this.subscribe(
        accountId,
        planId,
        (custom.billingCycle as AppSubscriptionBillingCycle) ?? 'monthly',
        DEFAULT_CURRENCY,
        paypalData.paypalSubscriptionId,
        paypalData.payerId,
        { provider: 'paypal', paymentCollected: true },
      );
      doc = await this.subscriptionModel
        .findOne({ paypalSubscriptionId: paypalData.paypalSubscriptionId })
        .exec();
    }

    if (doc) {
      await this.syncFromPayPalData(paypalData);
    }
  }

  async handlePayPalPaymentCompleted(data: {
    paypalSubscriptionId: string;
    transactionId: string;
    amountPaid?: number;
    currency?: string;
  }): Promise<void> {
    if (data.transactionId) {
      const paymentSeen = await this.historyModel
        .exists({ providerTransactionId: data.transactionId })
        .exec();
      if (paymentSeen) {
        this.logger.debug(
          `Skipping duplicate PayPal transaction ${data.transactionId}`,
        );
        return;
      }
    }

    const doc = await this.subscriptionModel
      .findOne({ paypalSubscriptionId: data.paypalSubscriptionId })
      .exec();
    if (!doc) {
      this.logger.warn(
        `No local sub for PayPal payment on ${data.paypalSubscriptionId}`,
      );
      return;
    }

    if (doc.status === 'trialing') {
      this.markTrialConverted(doc);
      doc.status = 'active';
    }

    if (data.amountPaid != null && data.amountPaid > 0) {
      doc.lastPaymentDate = new Date();
      await doc.save();
      await this.recordHistory(doc, 'renewed', 'Subscription payment received', {
        amountPaid: data.amountPaid,
        currency: (data.currency as SupportedCurrency) || DEFAULT_CURRENCY,
        providerTransactionId: data.transactionId,
      });
    }
  }

  async syncFromPayPalData(paypalData: PayPalSubscriptionData): Promise<void> {
    const sub = await this.subscriptionModel
      .findOne({ paypalSubscriptionId: paypalData.paypalSubscriptionId })
      .exec();
    if (!sub) {
      this.logger.warn(
        `No local sub for PayPal ${paypalData.paypalSubscriptionId}`,
      );
      return;
    }

    const normalizedStatus = paypalData.status.toUpperCase();
    if (normalizedStatus === 'ACTIVE') {
      const wasTrialing = sub.status === 'trialing';
      sub.status = 'active';
      if (wasTrialing) {
        this.markTrialConverted(sub);
      }
    } else if (normalizedStatus === 'APPROVAL_PENDING') {
      // Keep existing status until activation
    } else if (normalizedStatus === 'CANCELLED' || normalizedStatus === 'EXPIRED') {
      sub.status = 'cancelled';
      sub.autoRenew = false;
    } else if (normalizedStatus === 'SUSPENDED') {
      sub.autoRenew = false;
    }

    if (paypalData.currentPeriodStart) {
      sub.currentPeriodStart = paypalData.currentPeriodStart;
    }
    if (paypalData.currentPeriodEnd) {
      sub.currentPeriodEnd = paypalData.currentPeriodEnd;
      if (sub.status === 'active') {
        sub.endDate = paypalData.currentPeriodEnd;
      }
    }
    if (paypalData.nextPaymentDate) {
      sub.nextPaymentDate = paypalData.nextPaymentDate;
    }

    if (paypalData.payerId) {
      sub.paypalPayerId = paypalData.payerId;
    }

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
    } else if (paypalData.planId) {
      const plan = await this.plans.findByPayPalPlanId(paypalData.planId);
      if (plan && !sub.pendingPlanId) {
        sub.planId = plan.planId;
        if (paypalData.billingCycle) {
          sub.billingCycle = paypalData.billingCycle;
        }
      }
    }

    await sub.save();
  }

  async applyUpgrade(
    accountId: string,
    targetPlanId: string,
    billingCycle: AppSubscriptionBillingCycle = 'monthly',
  ): Promise<StudioUpgradeResult> {
    const sub = await this.requireActivePaidSubscription(accountId);
    const currentPlan = await this.plans.getByPlanId(sub.planId);
    const targetPlan = await this.plans.getByPlanId(targetPlanId);

    if (targetPlan.level === 'free') {
      throw new BadRequestException(
        'Cancel your subscription or manage billing in PayPal for the free plan',
      );
    }
    if (!isUpgrade(currentPlan.level, targetPlan.level)) {
      throw new BadRequestException(
        'Target plan is not a higher tier. Cancel your subscription or manage billing in PayPal to switch plans.',
      );
    }

    if (!sub.paypalSubscriptionId) {
      throw new BadRequestException(
        'Immediate upgrade requires an active PayPal subscription. Use checkout instead.',
      );
    }

    const { approvalUrl } = await this.paypal.reviseSubscription(
      sub.paypalSubscriptionId,
      targetPlanId,
      billingCycle,
    );

    sub.pendingPlanId = targetPlanId;
    sub.pendingBillingCycle = billingCycle;
    sub.pendingChangeEffectiveDate = sub.nextPaymentDate ?? sub.currentPeriodEnd;
    await sub.save();

    await this.recordHistory(
      sub,
      'upgraded',
      `Upgrade to ${targetPlan.name} (${billingCycle}) scheduled for next billing cycle`,
    );

    const refreshed = await this.subscriptionModel.findById(sub._id).exec();
    if (!refreshed) {
      throw new NotFoundException('Subscription not found after upgrade');
    }

    return {
      subscription: this.toSubscription(refreshed, this.plans.toPlan(targetPlan)),
      approvalUrl,
    };
  }

  async cancelPendingChange(accountId: string): Promise<StudioSubscription> {
    const sub = await this.subscriptionModel
      .findOne({
        accountId: new Types.ObjectId(accountId),
        status: { $in: ['active', 'trialing'] },
      })
      .exec();
    if (!sub?.pendingPlanId) {
      throw new BadRequestException('No pending upgrade');
    }

    const currentPlan = await this.plans.getByPlanId(sub.planId);

    sub.pendingPlanId = undefined;
    sub.pendingBillingCycle = undefined;
    sub.pendingChangeEffectiveDate = undefined;
    await sub.save();

    if (sub.paypalSubscriptionId) {
      await this.paypal.reviseSubscription(
        sub.paypalSubscriptionId,
        sub.planId,
        sub.billingCycle ?? 'monthly',
      );
    }

    await this.recordHistory(sub, 'pending_change_cancelled', 'Cancelled pending upgrade');
    return this.toSubscription(sub, this.plans.toPlan(currentPlan));
  }

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

    sub.cancelAtPeriodEnd = true;
    sub.autoRenew = false;
    sub.cancelledAt = new Date().toISOString();
    sub.cancellationReason = reason;
    sub.endDate = sub.currentPeriodEnd;
    await sub.save();

    const updated = await this.subscriptionModel.findById(sub._id).exec();
    if (!updated) {
      throw new NotFoundException('Subscription not found after cancel');
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

    if (!sub) {
      throw new BadRequestException('No subscription to reactivate');
    }

    sub.cancelAtPeriodEnd = false;
    sub.autoRenew = true;
    sub.cancelledAt = undefined;
    sub.cancellationReason = undefined;
    sub.endDate = sub.currentPeriodEnd;
    await sub.save();

    const updated = await this.subscriptionModel.findById(sub._id).exec();
    await this.recordHistory(updated!, 'reactivated', 'Reactivated subscription');
    const plan = await this.planModel.findOne({ planId: updated!.planId }).exec();
    return this.toSubscription(
      updated!,
      plan ? this.plans.toPlan(plan) : null,
    );
  }

  async processDeferredPayPalCancels(): Promise<number> {
    const now = new Date();
    const subs = await this.subscriptionModel
      .find({
        provider: 'paypal',
        cancelAtPeriodEnd: true,
        status: { $in: ['active', 'trialing'] },
        currentPeriodEnd: { $lte: now },
        paypalSubscriptionId: { $exists: true, $ne: null },
      })
      .exec();

    let cancelled = 0;
    for (const sub of subs) {
      try {
        await this.paypal.cancelSubscription(
          sub.paypalSubscriptionId!,
          sub.cancellationReason,
        );
        sub.status = 'cancelled';
        sub.autoRenew = false;
        await sub.save();
        cancelled += 1;
      } catch (error) {
        this.logger.error(
          `Failed deferred PayPal cancel for ${sub.paypalSubscriptionId}`,
          error,
        );
      }
    }
    return cancelled;
  }

  async reconcilePayPalSubscriptions(): Promise<number> {
    const subs = await this.subscriptionModel
      .find({
        provider: 'paypal',
        paypalSubscriptionId: { $exists: true, $ne: null },
        status: { $in: ['active', 'trialing'] },
      })
      .exec();

    let synced = 0;
    for (const sub of subs) {
      try {
        const data = await this.paypal.fetchSubscription(sub.paypalSubscriptionId!);
        await this.syncFromPayPalData(data);
        synced += 1;
      } catch (error) {
        this.logger.error(
          `Failed to reconcile PayPal sub ${sub.paypalSubscriptionId}`,
          error,
        );
      }
    }
    return synced;
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
      paypalSubscriptionId: doc.paypalSubscriptionId,
      paypalPayerId: doc.paypalPayerId,
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
    if (sub.provider !== 'paypal' || !sub.paypalSubscriptionId) {
      throw new BadRequestException(
        'Plan changes via PayPal require an active paid PayPal subscription',
      );
    }
    return sub;
  }
}
