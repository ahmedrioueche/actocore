import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { StudioAuthConfig } from '../config/studio-auth.config';
import { ProjectsService } from '../projects/projects.service';
import { StudioSubscriptionService } from '../studio-billing/studio-subscription.service';
import { StudioAccount, StudioAccountDocument } from './schemas/studio-account.schema';
import {
  StudioMembership,
  StudioMembershipDocument,
} from './schemas/studio-membership.schema';
import { StudioUser, StudioUserDocument } from './schemas/studio-user.schema';
import {
  seedStudioTestAccounts,
  shouldSeedStudioTestAccounts,
} from './studio-test-accounts.seed.util';

@Injectable()
export class StudioTestAccountsBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(StudioTestAccountsBootstrapService.name);

  constructor(
    @InjectModel(StudioUser.name)
    private readonly userModel: Model<StudioUserDocument>,
    @InjectModel(StudioAccount.name)
    private readonly accountModel: Model<StudioAccountDocument>,
    @InjectModel(StudioMembership.name)
    private readonly membershipModel: Model<StudioMembershipDocument>,
    private readonly config: ConfigService,
    private readonly projects: ProjectsService,
    private readonly subscriptions: StudioSubscriptionService,
  ) {}

  async onModuleInit(): Promise<void> {
    const authConfig = this.config.getOrThrow<StudioAuthConfig>('studioAuth');
    if (authConfig.disabled || !shouldSeedStudioTestAccounts()) {
      return;
    }

    try {
      await seedStudioTestAccounts({
        userModel: this.userModel,
        accountModel: this.accountModel,
        membershipModel: this.membershipModel,
        projects: this.projects,
        subscriptions: this.subscriptions,
        authConfig,
        logger: this.logger,
      });
    } catch (error) {
      this.logger.error('Failed to seed Studio test accounts', error);
    }
  }
}
