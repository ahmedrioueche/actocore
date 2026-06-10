import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import {
  ProjectAction,
  ProjectActionSchema,
} from '../actions/schemas/project-action.schema';
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
  StudioPayPalWebhookEventModel,
  StudioPayPalWebhookEventSchema,
  StudioPlanModel,
  StudioPlanSchema,
  StudioSubscriptionHistoryModel,
  StudioSubscriptionHistorySchema,
  StudioSubscriptionModel,
  StudioSubscriptionSchema,
} from './schemas/billing.schema';
import { StudioPayPalWebhookDedupService } from './studio-paypal-webhook-dedup.service';
import { StudioBillingController } from './studio-billing.controller';
import { StudioPlansAdminController } from './studio-plans-admin.controller';
import { StudioPayPalWebhookController } from './studio-paypal-webhook.controller';
import { StudioPlansService } from './studio-plans.service';
import { StudioSubscriptionService } from './studio-subscription.service';
import { StudioPayPalCatalogService } from './studio-paypal-catalog.service';
import { StudioPayPalHttpService } from './studio-paypal-http.service';
import { StudioPayPalService } from './studio-paypal.service';
import { StudioEntitlementsService } from './studio-entitlements.service';
import { StudioBillingReconcileService } from './studio-billing-reconcile.service';
import { PlatformPermissionGuard } from '../studio/guards/platform-permission.guard';

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
        name: StudioPayPalWebhookEventModel.name,
        schema: StudioPayPalWebhookEventSchema,
      },
      { name: StudioAccount.name, schema: StudioAccountSchema },
      { name: StudioMembership.name, schema: StudioMembershipSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: ProjectAction.name, schema: ProjectActionSchema },
    ]),
  ],
  controllers: [
    StudioBillingController,
    StudioPlansAdminController,
    StudioPayPalWebhookController,
  ],
  providers: [
    StudioPlansService,
    StudioSubscriptionService,
    StudioPayPalHttpService,
    StudioPayPalService,
    StudioPayPalCatalogService,
    StudioPayPalWebhookDedupService,
    StudioEntitlementsService,
    StudioBillingReconcileService,
    PlatformPermissionGuard,
  ],
  exports: [
    StudioPlansService,
    StudioSubscriptionService,
    StudioEntitlementsService,
    forwardRef(() => BillingModule),
  ],
})
export class StudioBillingModule {}
