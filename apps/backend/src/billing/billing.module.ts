import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { RedisModule } from '../redis/redis.module';
import { StudioAccount, StudioAccountSchema } from '../studio/schemas/studio-account.schema';
import {
  StudioMembership,
  StudioMembershipSchema,
} from '../studio/schemas/studio-membership.schema';
import { StudioUser, StudioUserSchema } from '../studio/schemas/studio-user.schema';
import { StudioModule } from '../studio/studio.module';
import { StudioBillingModule } from '../studio-billing/studio-billing.module';
import { UsageModule } from '../usage/usage.module';
import { ChatQuotaGuard } from './guards/chat-quota.guard';
import { QuotaAlertService } from './quota-alert.service';
import { QuotaService } from './quota.service';

@Module({
  imports: [
    RedisModule,
    forwardRef(() => UsageModule),
    forwardRef(() => StudioModule),
    forwardRef(() => StudioBillingModule),
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: StudioAccount.name, schema: StudioAccountSchema },
      { name: StudioMembership.name, schema: StudioMembershipSchema },
      { name: StudioUser.name, schema: StudioUserSchema },
    ]),
  ],
  providers: [QuotaService, QuotaAlertService, ChatQuotaGuard],
  exports: [QuotaService, QuotaAlertService, ChatQuotaGuard],
})
export class BillingModule {}
