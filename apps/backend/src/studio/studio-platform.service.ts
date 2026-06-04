import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { PlatformAccountListItemData } from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
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
    const filter: Record<string, unknown> = {};
    const search = options.search?.trim();
    if (search) {
      filter.name = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }

    const accounts = await this.accountModel
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .exec();

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
