import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StudioRole } from '@ahmedrioueche/actocore-shared';
import type { PlatformAuthConfig } from '../config/platform-auth.config';
import { StudioAccount, StudioAccountDocument } from './schemas/studio-account.schema';
import {
  StudioMembership,
  StudioMembershipDocument,
} from './schemas/studio-membership.schema';
import { StudioUser, StudioUserDocument } from './schemas/studio-user.schema';

@Injectable()
export class StudioPlatformBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(StudioPlatformBootstrapService.name);
  private platformAccountId: string | null = null;
  private bootstrapPromise: Promise<void> | null = null;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(StudioAccount.name)
    private readonly accountModel: Model<StudioAccountDocument>,
    @InjectModel(StudioUser.name)
    private readonly userModel: Model<StudioUserDocument>,
    @InjectModel(StudioMembership.name)
    private readonly membershipModel: Model<StudioMembershipDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureBootstrapped();
  }

  async ensureBootstrapped(): Promise<void> {
    if (!this.bootstrapPromise) {
      this.bootstrapPromise = this.runBootstrap();
    }
    await this.bootstrapPromise;
  }

  getPlatformAccountId(): string | null {
    return this.platformAccountId;
  }

  async getPlatformAccountIdReady(): Promise<string | null> {
    await this.ensureBootstrapped();
    return this.platformAccountId;
  }

  getPlatformAccountObjectId(): Types.ObjectId | null {
    return this.platformAccountId != null
      ? new Types.ObjectId(this.platformAccountId)
      : null;
  }

  async getPlatformAccountObjectIdReady(): Promise<Types.ObjectId | null> {
    await this.ensureBootstrapped();
    return this.getPlatformAccountObjectId();
  }

  private async runBootstrap(): Promise<void> {
    await this.dropStaleUserIndexes();
    await this.ensureMembershipLoginNameIndex();
    await this.ensurePlatformWorkspace();
  }

  isPlatformAccount(accountId: string): boolean {
    return (
      this.platformAccountId != null && this.platformAccountId === accountId
    );
  }

  isMasterUser(user: StudioUserDocument): boolean {
    return Boolean(user.isPlatformMaster);
  }

  private cfg(): PlatformAuthConfig {
    return this.config.getOrThrow<PlatformAuthConfig>('platformAuth');
  }

  private async dropStaleUserIndexes(): Promise<void> {
    const collection = this.userModel.collection;
    const indexes = await collection.indexes();
    if (!indexes.some((index) => index.name === 'username_1')) {
      return;
    }

    try {
      await collection.dropIndex('username_1');
      this.logger.log('Dropped stale studio_users index "username_1"');
    } catch (error) {
      this.logger.warn(
        'Could not drop stale studio_users index "username_1"',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async ensureMembershipLoginNameIndex(): Promise<void> {
    const collection = this.membershipModel.collection;
    const indexes = await collection.indexes();
    const existing = indexes.find((index) => index.name === 'accountId_1_loginName_1');
    if (existing?.partialFilterExpression) {
      return;
    }

    try {
      if (existing) {
        await collection.dropIndex('accountId_1_loginName_1');
      }
      await collection.createIndex(
        { accountId: 1, loginName: 1 },
        {
          unique: true,
          name: 'accountId_1_loginName_1',
          partialFilterExpression: {
            loginName: { $exists: true, $type: 'string' },
          },
        },
      );
      this.logger.log('Ensured partial unique index on studio_memberships loginName');
    } catch (error) {
      this.logger.warn(
        'Could not ensure studio_memberships loginName index',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async repairPlatformMembershipLoginNames(
    accountId: Types.ObjectId,
  ): Promise<void> {
    const brokenMemberships = await this.membershipModel
      .find({ accountId, loginName: null })
      .exec();
    if (brokenMemberships.length === 0) {
      return;
    }

    for (const membership of brokenMemberships) {
      const user = await this.userModel.findById(membership.userId).exec();
      if (!user) {
        continue;
      }

      if (user.isPlatformMaster) {
        await this.membershipModel
          .updateOne({ _id: membership._id }, { $unset: { loginName: '' } })
          .exec();
        continue;
      }

      if (user.platformLoginName) {
        await this.membershipModel
          .updateOne(
            { _id: membership._id },
            { $set: { loginName: user.platformLoginName } },
          )
          .exec();
        continue;
      }

      await this.membershipModel
        .updateOne({ _id: membership._id }, { $unset: { loginName: '' } })
        .exec();
    }
  }

  private async ensurePlatformWorkspace(): Promise<void> {
    const { accountName, masterEmail } = this.cfg();
    if (!masterEmail) {
      this.logger.warn('Platform master email not configured — admin login disabled');
      return;
    }

    let account = await this.accountModel
      .findOne({ name: accountName })
      .exec();
    if (!account) {
      account = await this.accountModel.create({ name: accountName });
      this.logger.log(`Created platform account "${accountName}"`);
    }
    this.platformAccountId = account._id.toString();

    let masterUser = await this.userModel.findOne({ email: masterEmail }).exec();
    if (!masterUser) {
      masterUser = await this.userModel.create({
        email: masterEmail,
        emailVerified: true,
        isPlatformMaster: true,
        displayName: 'Platform Master',
      });
      this.logger.log(`Created platform master user ${masterEmail}`);
    } else if (!masterUser.isPlatformMaster) {
      masterUser.isPlatformMaster = true;
      masterUser.emailVerified = true;
      await masterUser.save();
    }

    await this.repairPlatformMembershipLoginNames(account._id);

    const existingMembership = await this.membershipModel
      .findOne({
        userId: masterUser._id,
        accountId: account._id,
      })
      .exec();
    if (!existingMembership) {
      await this.membershipModel
        .findOneAndUpdate(
          { userId: masterUser._id, accountId: account._id },
          {
            $setOnInsert: {
              userId: masterUser._id,
              accountId: account._id,
              role: StudioRole.SUPER_ADMIN,
              permissions: [],
              projectIds: [],
            },
            $unset: { loginName: '' },
          },
          { upsert: true },
        )
        .exec();
      this.logger.log('Linked platform master to platform account');
    }
  }
}
