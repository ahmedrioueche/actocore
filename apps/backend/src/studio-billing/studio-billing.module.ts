import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { BillingModule } from '../billing/billing.module';
import { UsageModule } from '../usage/usage.module';
import { StudioModule } from '../studio/studio.module';
import { StudioAccount, StudioAccountSchema } from '../studio/schemas/studio-account.schema';
import {
  StudioMembership,
  StudioMembershipSchema,
} from '../studio/schemas/studio-membership.schema';
import {
  StudioPaddleWebhookEventModel,
  StudioPaddleWebhookEventSchema,
  StudioPlanModel,
  StudioPlanSchema,
  StudioSubscriptionHistoryModel,
  StudioSubscriptionHistorySchema,
  StudioSubscriptionModel,
  StudioSubscriptionSchema,
} from './schemas/billing.schema';
import { StudioPaddleWebhookDedupService } from './studio-paddle-webhook-dedup.service';
import { StudioBillingController } from './studio-billing.controller';
import { StudioPlansAdminController } from './studio-plans-admin.controller';
import { StudioPaddleWebhookController } from './studio-paddle-webhook.controller';
import { StudioPlansService } from './studio-plans.service';
import { StudioSubscriptionService } from './studio-subscription.service';
import { StudioPaddleService } from './studio-paddle.service';
import { StudioEntitlementsService } from './studio-entitlements.service';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => UsageModule),
    forwardRef(() => BillingModule),
    forwardRef(() => StudioModule),
    MongooseModule.forFeature([
      { name: StudioPlanModel.name, schema: StudioPlanSchema },
      { name: StudioSubscriptionModel.name, schema: StudioSubscriptionSchema },
      {
        name: StudioSubscriptionHistoryModel.name,
        schema: StudioSubscriptionHistorySchema,
      },
      {
        name: StudioPaddleWebhookEventModel.name,
        schema: StudioPaddleWebhookEventSchema,
      },
      { name: StudioAccount.name, schema: StudioAccountSchema },
      { name: StudioMembership.name, schema: StudioMembershipSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [
    StudioBillingController,
    StudioPlansAdminController,
    StudioPaddleWebhookController,
  ],
  providers: [
    StudioPlansService,
    StudioSubscriptionService,
    StudioPaddleService,
    StudioPaddleWebhookDedupService,
    StudioEntitlementsService,
  ],
  exports: [
    StudioPlansService,
    StudioSubscriptionService,
    StudioEntitlementsService,
    forwardRef(() => BillingModule),
  ],
})
export class StudioBillingModule {}
