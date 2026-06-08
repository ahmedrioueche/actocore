import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  Paginated,
  PaginationQuery,
  PlatformAccountListItemData,
  PlatformAnalyticsOverview,
  PlatformProjectListItem,
  PlatformSubscriptionListItem,
  PlatformUserListItem,
  StudioBillingHistoryEntry,
  StudioSubscription,
} from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
import {
  normalizePagination,
  paginate,
} from '../common/pagination/pagination.util';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import {
  StudioPlanModel,
  StudioSubscriptionHistoryModel,
  StudioSubscriptionModel,
} from '../studio-billing/schemas/billing.schema';
import { StudioSubscriptionService } from '../studio-billing/studio-subscription.service';
import { UsageEvent, UsageEventDocument } from '../usage/schemas/usage-event.schema';
import { StudioAccount, StudioAccountDocument } from './schemas/studio-account.schema';
import {
  StudioMembership,
  StudioMembershipDocument,
} from './schemas/studio-membership.schema';
import { StudioUser, StudioUserDocument } from './schemas/studio-user.schema';
import { StudioPlatformBootstrapService } from './studio-platform-bootstrap.service';

@Injectable()
export class StudioPlatformService {
  constructor(
    private readonly bootstrap: StudioPlatformBootstrapService,
    @InjectModel(StudioAccount.name)
    private readonly accountModel: Model<StudioAccountDocument>,
    @InjectModel(StudioSubscriptionModel.name)
    private readonly subscriptionModel: Model<StudioSubscriptionModel>,
    @InjectModel(StudioSubscriptionHistoryModel.name)
    private readonly historyModel: Model<StudioSubscriptionHistoryModel>,
    @InjectModel(StudioUser.name)
    private readonly userModel: Model<StudioUserDocument>,
    @InjectModel(StudioMembership.name)
    private readonly membershipModel: Model<StudioMembershipDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(StudioPlanModel.name)
    private readonly planModel: Model<StudioPlanModel>,
    @InjectModel(UsageEvent.name)
    private readonly usageEventModel: Model<UsageEventDocument>,
    private readonly subscriptions: StudioSubscriptionService,
  ) {}

  async listAccounts(options: {
    search?: string;
    limit?: number;
  }): Promise<PlatformAccountListItemData[]> {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
    const filter = this.buildTenantAccountFilter(options.search);

    const accounts = await this.accountModel
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .exec();

    return this.enrichAccounts(accounts);
  }

  async listAccountsPaginated(
    options: { search?: string } & PaginationQuery = {},
  ): Promise<Paginated<PlatformAccountListItemData>> {
    const { page, limit, skip } = normalizePagination(options);
    const filter = this.buildTenantAccountFilter(options.search);

    const [accounts, total] = await Promise.all([
      this.accountModel
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.accountModel.countDocuments(filter).exec(),
    ]);

    return paginate(await this.enrichAccounts(accounts), total, { page, limit });
  }

  async getAccount(accountId: string): Promise<PlatformAccountListItemData | null> {
    if (!Types.ObjectId.isValid(accountId)) {
      return null;
    }
    const doc = await this.accountModel.findById(accountId).exec();
    if (!doc || this.bootstrap.isPlatformAccount(doc._id.toString())) {
      return null;
    }
    const enriched = await this.enrichAccounts([doc]);
    return enriched[0] ?? null;
  }

  async listSubscriptionsPaginated(
    options: {
      search?: string;
      status?: string;
    } & PaginationQuery = {},
  ): Promise<Paginated<PlatformSubscriptionListItem>> {
    const { page, limit, skip } = normalizePagination(options);
    const platformAccountId = this.bootstrap.getPlatformAccountId();
    const accountFilter = platformAccountId
      ? { accountId: { $ne: new Types.ObjectId(platformAccountId) } }
      : {};

    let accountIds: Types.ObjectId[] | undefined;
    if (options.search?.trim()) {
      const accounts = await this.accountModel
        .find({
          ...accountFilter,
          name: {
            $regex: options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            $options: 'i',
          },
        })
        .select('_id')
        .exec();
      accountIds = accounts.map((a) => a._id);
      if (accountIds.length === 0) {
        return paginate([], 0, { page, limit });
      }
    }

    const filter: Record<string, unknown> = { ...accountFilter };
    if (accountIds) {
      filter.accountId = { $in: accountIds };
    }
    if (options.status?.trim()) {
      filter.status = options.status.trim();
    }

    const [subs, total] = await Promise.all([
      this.subscriptionModel
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.subscriptionModel.countDocuments(filter).exec(),
    ]);

    const accountNameById = await this.accountNames(
      subs.map((s) => s.accountId.toString()),
    );

    const items: PlatformSubscriptionListItem[] = subs.map((sub) => ({
      id: sub._id.toString(),
      accountId: sub.accountId.toString(),
      accountName: accountNameById.get(sub.accountId.toString()) ?? 'Unknown',
      planId: sub.planId,
      status: sub.status,
      provider: sub.provider,
      billingCycle: sub.billingCycle,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString(),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      createdAt: (sub.createdAt ?? new Date()).toISOString(),
    }));

    return paginate(items, total, { page, limit });
  }

  async getAccountSubscriptionDetail(accountId: string): Promise<{
    subscription: StudioSubscription | null;
    payments: StudioBillingHistoryEntry[];
  } | null> {
    if (!Types.ObjectId.isValid(accountId) || this.bootstrap.isPlatformAccount(accountId)) {
      return null;
    }

    const summary = await this.subscriptions.getSummary(accountId);
    const history = await this.historyModel
      .find({ accountId: new Types.ObjectId(accountId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    const payments: StudioBillingHistoryEntry[] = history.map((row) => ({
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
    }));

    return {
      subscription: summary.subscription,
      payments,
    };
  }

  async listUsersPaginated(
    options: { search?: string } & PaginationQuery = {},
  ): Promise<Paginated<PlatformUserListItem>> {
    const { page, limit, skip } = normalizePagination(options);
    const platformAccountId = this.bootstrap.getPlatformAccountId();

    const filter: Record<string, unknown> = { isPlatformMaster: { $ne: true } };
    if (platformAccountId) {
      const platformMembers = await this.membershipModel
        .find({ accountId: new Types.ObjectId(platformAccountId) })
        .select('userId')
        .exec();
      filter._id = {
        $nin: platformMembers.map((m) => m.userId),
      };
    }

    const trimmed = options.search?.trim();
    if (trimmed) {
      const regex = {
        $regex: trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        $options: 'i',
      };
      filter.$or = [{ email: regex }, { platformLoginName: regex }, { displayName: regex }];
    }

    const [users, total] = await Promise.all([
      this.userModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    const counts = await this.membershipModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { userId: { $in: users.map((u) => u._id) } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);
    const countByUser = new Map(counts.map((c) => [c._id.toString(), c.count]));

    const items: PlatformUserListItem[] = users.map((user) => ({
      id: user._id.toString(),
      email: user.email,
      platformLoginName: user.platformLoginName,
      displayName: user.displayName,
      membershipCount: countByUser.get(user._id.toString()) ?? 0,
      createdAt: (user.createdAt ?? new Date()).toISOString(),
    }));

    return paginate(items, total, { page, limit });
  }

  async listProjectsPaginated(
    options: { search?: string } & PaginationQuery = {},
  ): Promise<Paginated<PlatformProjectListItem>> {
    const { page, limit, skip } = normalizePagination(options);
    const platformAccountId = this.bootstrap.getPlatformAccountId();

    const filter: Record<string, unknown> = {};
    if (platformAccountId) {
      filter.accountId = { $ne: platformAccountId };
    }
    const trimmed = options.search?.trim();
    if (trimmed) {
      filter.name = {
        $regex: trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        $options: 'i',
      };
    }

    const [projects, total] = await Promise.all([
      this.projectModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.projectModel.countDocuments(filter).exec(),
    ]);

    const accountNameById = await this.accountNames(
      projects.map((p) => p.accountId),
    );

    const items: PlatformProjectListItem[] = projects.map((project) => ({
      id: project._id.toString(),
      accountId: project.accountId,
      accountName: accountNameById.get(project.accountId) ?? 'Unknown',
      name: project.name,
      archived: project.archived,
      createdAt: (project.createdAt ?? new Date()).toISOString(),
    }));

    return paginate(items, total, { page, limit });
  }

  async getAnalyticsOverview(): Promise<PlatformAnalyticsOverview> {
    const platformAccountId = this.bootstrap.getPlatformAccountId();
    const tenantFilter = platformAccountId
      ? { _id: { $ne: new Types.ObjectId(platformAccountId) } }
      : {};
    const tenantAccountIdFilter = platformAccountId
      ? { accountId: { $ne: new Types.ObjectId(platformAccountId) } }
      : {};
    const tenantProjectFilter = platformAccountId
      ? { accountId: { $ne: platformAccountId } }
      : {};

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const [
      totalAccounts,
      activeSubscriptions,
      trialingSubscriptions,
      totalProjects,
      monthlyChatRequests,
      activeSubs,
      plans,
    ] = await Promise.all([
      this.accountModel.countDocuments(tenantFilter).exec(),
      this.subscriptionModel
        .countDocuments({ ...tenantAccountIdFilter, status: 'active' })
        .exec(),
      this.subscriptionModel
        .countDocuments({ ...tenantAccountIdFilter, status: 'trialing' })
        .exec(),
      this.projectModel.countDocuments(tenantProjectFilter).exec(),
      this.usageEventModel
        .countDocuments({
          createdAt: { $gte: monthStart },
          route: { $regex: /chat/i },
        })
        .exec(),
      this.subscriptionModel
        .find({ ...tenantAccountIdFilter, status: { $in: ['active', 'trialing'] } })
        .exec(),
      this.planModel.find({ isActive: { $ne: false } }).exec(),
    ]);

    const planPriceById = new Map(
      plans.map((plan) => {
        const usd = plan.pricing?.USD ?? plan.pricing?.usd ?? Object.values(plan.pricing ?? {})[0];
        const monthly = usd?.monthly ?? (usd?.yearly != null ? usd.yearly / 12 : 0);
        return [plan.planId, monthly ?? 0] as const;
      }),
    );

    let estimatedMrr = 0;
    for (const sub of activeSubs) {
      if (sub.status === 'trialing') {
        continue;
      }
      estimatedMrr += planPriceById.get(sub.planId) ?? 0;
    }

    return {
      totalAccounts,
      activeSubscriptions,
      trialingSubscriptions,
      estimatedMrr: Math.round(estimatedMrr * 100) / 100,
      totalProjects,
      monthlyChatRequests,
    };
  }

  private buildTenantAccountFilter(search?: string): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    const platformAccountId = this.bootstrap.getPlatformAccountId();
    if (platformAccountId) {
      filter._id = { $ne: new Types.ObjectId(platformAccountId) };
    }
    const trimmed = search?.trim();
    if (trimmed) {
      filter.name = {
        $regex: trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        $options: 'i',
      };
    }
    return filter;
  }

  private async enrichAccounts(
    accounts: StudioAccountDocument[],
  ): Promise<PlatformAccountListItemData[]> {
    const accountIds = accounts.map((a) => a._id);
    const subs = await this.subscriptionModel
      .find({
        accountId: { $in: accountIds },
        status: { $in: ['active', 'trialing'] },
      })
      .exec();
    const planByAccount = new Map(
      subs.map((s) => [s.accountId.toString(), s.planId]),
    );

    return accounts.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      billingEmail: doc.billingEmail,
      planId: planByAccount.get(doc._id.toString()),
      paypalPayerId: doc.paypalPayerId,
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
      updatedAt: (doc.updatedAt ?? new Date()).toISOString(),
    }));
  }

  private async accountNames(accountIds: string[]): Promise<Map<string, string>> {
    const unique = [...new Set(accountIds.filter((id) => Types.ObjectId.isValid(id)))];
    if (unique.length === 0) {
      return new Map();
    }
    const accounts = await this.accountModel
      .find({ _id: { $in: unique } })
      .select('name')
      .exec();
    return new Map(accounts.map((a) => [a._id.toString(), a.name]));
  }
}
