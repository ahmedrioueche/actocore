import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  Paginated,
  PaginationQuery,
  PlatformAccountListItemData,
} from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
import {
  normalizePagination,
  paginate,
} from '../common/pagination/pagination.util';
import {
  StudioSubscriptionModel,
} from '../studio-billing/schemas/billing.schema';
import { StudioAccount, StudioAccountDocument } from './schemas/studio-account.schema';

@Injectable()
export class StudioPlatformService {
  constructor(
    @InjectModel(StudioAccount.name)
    private readonly accountModel: Model<StudioAccountDocument>,
    @InjectModel(StudioSubscriptionModel.name)
    private readonly subscriptionModel: Model<StudioSubscriptionModel>,
  ) {}

  async listAccounts(options: {
    search?: string;
    limit?: number;
  }): Promise<PlatformAccountListItemData[]> {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
    const filter = this.buildAccountFilter(options.search);

    const accounts = await this.accountModel
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .exec();

    return this.enrichAccounts(accounts);
  }

  /** Paginated variant used by the Studio platform accounts route. */
  async listAccountsPaginated(
    options: { search?: string } & PaginationQuery = {},
  ): Promise<Paginated<PlatformAccountListItemData>> {
    const { page, limit, skip } = normalizePagination(options);
    const filter = this.buildAccountFilter(options.search);

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

  private buildAccountFilter(search?: string): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
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
      paddleCustomerId: doc.paddleCustomerId,
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
      updatedAt: (doc.updatedAt ?? new Date()).toISOString(),
    }));
  }

  async getAccount(accountId: string): Promise<PlatformAccountListItemData | null> {
    if (!Types.ObjectId.isValid(accountId)) {
      return null;
    }
    const doc = await this.accountModel.findById(accountId).exec();
    if (!doc) {
      return null;
    }
    const sub = await this.subscriptionModel
      .findOne({
        accountId: doc._id,
        status: { $in: ['active', 'trialing'] },
      })
      .exec();
    return {
      id: doc._id.toString(),
      name: doc.name,
      billingEmail: doc.billingEmail,
      planId: sub?.planId,
      paddleCustomerId: doc.paddleCustomerId,
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
      updatedAt: (doc.updatedAt ?? new Date()).toISOString(),
    };
  }
}
