import { Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import {
  STUDIO_TEST_ACCOUNTS,
  StudioRole,
  isStudioFeatureFlagEnabled,
  resolveStudioPermissions,
  type StudioTestAccountDefinition,
} from '@ahmedrioueche/actocore-shared';
import type { StudioAuthConfig } from '../config/studio-auth.config';
import type { ProjectsService } from '../projects/projects.service';
import type { StudioSubscriptionService } from '../studio-billing/studio-subscription.service';
import type { StudioAccountDocument } from './schemas/studio-account.schema';
import type { StudioMembershipDocument } from './schemas/studio-membership.schema';
import type { StudioUserDocument } from './schemas/studio-user.schema';
import type { StudioRequestContext } from './studio-context';
import { hashPassword } from './utils/password-crypto';

export function shouldSeedStudioTestAccounts(): boolean {
  return isStudioFeatureFlagEnabled('testAccounts', process.env);
}

export async function seedStudioTestAccounts(deps: {
  userModel: Model<StudioUserDocument>;
  accountModel: Model<StudioAccountDocument>;
  membershipModel: Model<StudioMembershipDocument>;
  projects: ProjectsService;
  subscriptions: StudioSubscriptionService;
  authConfig: StudioAuthConfig;
  logger?: Logger;
}): Promise<void> {
  const logger = deps.logger ?? new Logger('StudioTestAccountsSeed');

  for (const account of STUDIO_TEST_ACCOUNTS) {
    await ensureTestAccount(account, deps, logger);
  }
}

async function ensureTestAccount(
  definition: StudioTestAccountDefinition,
  deps: {
    userModel: Model<StudioUserDocument>;
    accountModel: Model<StudioAccountDocument>;
    membershipModel: Model<StudioMembershipDocument>;
    projects: ProjectsService;
    subscriptions: StudioSubscriptionService;
    authConfig: StudioAuthConfig;
  },
  logger: Logger,
): Promise<void> {
  const email = definition.email.trim().toLowerCase();
  const existingUser = await deps.userModel.findOne({ email }).exec();

  if (existingUser) {
    if (!existingUser.emailVerified) {
      existingUser.emailVerified = true;
      existingUser.verificationToken = undefined;
      existingUser.verificationTokenExpiry = undefined;
      await existingUser.save();
      logger.log(`Verified existing test account ${email}`);
    }
    return;
  }

  const passwordHash = await hashPassword(
    definition.password,
    deps.authConfig.passwordPepper,
  );

  const account = await deps.accountModel.create({
    name: definition.accountName,
  });
  const user = await deps.userModel.create({
    email,
    passwordHash,
    displayName: definition.displayName,
    emailVerified: true,
  });
  const membership = await deps.membershipModel.create({
    userId: user._id,
    accountId: account._id,
    role: StudioRole.USER_ADMIN,
    permissions: [],
    projectIds: [],
  });

  if (deps.authConfig.defaultProjectOnSignup) {
    const ctx: StudioRequestContext = {
      accountId: account._id.toString(),
      userId: user._id.toString(),
      email,
      role: StudioRole.USER_ADMIN,
      permissions: resolveStudioPermissions(StudioRole.USER_ADMIN, []),
      projectIds: [],
    };

    const project = await deps.projects.create(ctx, {
      name:
        definition.defaultProjectName?.trim() ||
        deps.authConfig.defaultProjectName,
    });

    membership.projectIds = [project.id];
    await membership.save();
  }

  try {
    await deps.subscriptions.startFreeTrial(account._id.toString(), 'free');
  } catch {
    // Plan may already exist or billing disabled in some environments.
  }

  logger.log(`Seeded Studio test account ${email}`);
}
