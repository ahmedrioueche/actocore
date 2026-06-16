import { Module, forwardRef } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import type { StudioAuthConfig } from '../config/studio-auth.config';
import { ApiKey, ApiKeySchema } from '../auth/schemas/api-key.schema';
import {
  ProjectAction,
  ProjectActionSchema,
} from '../actions/schemas/project-action.schema';
import {
  KnowledgeChunk,
  KnowledgeChunkSchema,
} from '../knowledge/schemas/knowledge-chunk.schema';
import {
  KnowledgeSource,
  KnowledgeSourceSchema,
} from '../knowledge/schemas/knowledge-source.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { ProjectsModule } from '../projects/projects.module';
import { StudioBillingModule } from '../studio-billing/studio-billing.module';
import {
  ChatMessage,
  ChatMessageSchema,
} from '../sessions/schemas/chat-message.schema';
import {
  ChatSession,
  ChatSessionSchema,
} from '../sessions/schemas/chat-session.schema';
import { UsageEvent, UsageEventSchema } from '../usage/schemas/usage-event.schema';
import { RedisModule } from '../redis/redis.module';
import {
  StudioPlanModel,
  StudioPlanSchema,
  StudioSubscriptionHistoryModel,
  StudioSubscriptionHistorySchema,
  StudioSubscriptionModel,
  StudioSubscriptionSchema,
} from '../studio-billing/schemas/billing.schema';
import { StudioWebRateLimitInterceptor } from './interceptors/studio-web-rate-limit.interceptor';
import { StudioPlatformAuthController } from './studio-platform-auth.controller';
import { StudioPlatformAuthService } from './studio-platform-auth.service';
import { StudioPlatformBootstrapService } from './studio-platform-bootstrap.service';
import { StudioTestAccountsBootstrapService } from './studio-test-accounts-bootstrap.service';
import { StudioTestAccountLeaseService } from './studio-test-account-lease.service';
import { StudioPlatformController } from './studio-platform.controller';
import { StudioPlatformManagersController } from './studio-platform-managers.controller';
import { StudioPlatformManagersService } from './studio-platform-managers.service';
import { StudioPlatformService } from './studio-platform.service';
import { PlatformPermissionGuard } from './guards/platform-permission.guard';
import { StudioPlatformAccessService } from './studio-platform-access.service';
import { StudioAdminEmailsService } from './studio-admin-emails.service';
import { StudioAdminNotificationService } from './studio-admin-notification.service';
import { StudioQuotaWebhookService } from './studio-quota-webhook.service';
import { StudioAccountDeleteService } from './studio-account-delete.service';
import { StudioAccountController } from './studio-account.controller';
import { StudioAccountService } from './studio-account.service';
import { StudioOnboardingController } from './studio-onboarding.controller';
import { StudioOnboardingService } from './studio-onboarding.service';
import { StudioAuthController } from './studio-auth.controller';
import { StudioContactController } from './studio-contact.controller';
import { StudioReportsController } from './studio-reports.controller';
import { StudioReportsService } from './studio-reports.service';
import { StudioEmailService } from './studio-email.service';
import { StudioAccessService } from './studio-access.service';
import { StudioAuthService } from './studio-auth.service';
import { StudioMembersService } from './studio-members.service';
import { StudioTeamAuditService } from './studio-team-audit.service';
import {
  StudioTeamAudit,
  StudioTeamAuditSchema,
} from './schemas/studio-team-audit.schema';
import {
  StudioReport,
  StudioReportSchema,
} from './schemas/studio-report.schema';
import { StudioAuthGuard } from './guards/studio-auth.guard';
import { StudioPermissionsGuard } from './guards/studio-permissions.guard';
import { StudioRoleGuard } from './guards/studio-role.guard';
import { StudioAccount, StudioAccountSchema } from './schemas/studio-account.schema';
import {
  StudioMembership,
  StudioMembershipSchema,
} from './schemas/studio-membership.schema';
import { StudioUser, StudioUserSchema } from './schemas/studio-user.schema';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    forwardRef(() => ProjectsModule),
    forwardRef(() => StudioBillingModule),
    MongooseModule.forFeature([
      { name: StudioAccount.name, schema: StudioAccountSchema },
      { name: StudioUser.name, schema: StudioUserSchema },
      { name: StudioMembership.name, schema: StudioMembershipSchema },
      { name: StudioTeamAudit.name, schema: StudioTeamAuditSchema },
      { name: StudioReport.name, schema: StudioReportSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: ApiKey.name, schema: ApiKeySchema },
      { name: ProjectAction.name, schema: ProjectActionSchema },
      { name: KnowledgeSource.name, schema: KnowledgeSourceSchema },
      { name: KnowledgeChunk.name, schema: KnowledgeChunkSchema },
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: UsageEvent.name, schema: UsageEventSchema },
      { name: StudioSubscriptionModel.name, schema: StudioSubscriptionSchema },
      {
        name: StudioSubscriptionHistoryModel.name,
        schema: StudioSubscriptionHistorySchema,
      },
      { name: StudioPlanModel.name, schema: StudioPlanSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const studioAuth = config.getOrThrow<StudioAuthConfig>('studioAuth');
        return {
          secret: studioAuth.jwtSecret,
          signOptions: {
            expiresIn: studioAuth.jwtAccessExpiresIn as `${number}m`,
          },
        };
      },
    }),
  ],
  controllers: [
    StudioAuthController,
    StudioContactController,
    StudioReportsController,
    StudioAccountController,
    StudioOnboardingController,
    StudioPlatformController,
    StudioPlatformAuthController,
    StudioPlatformManagersController,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: StudioWebRateLimitInterceptor,
    },
    StudioAuthService,
    StudioAccountService,
    StudioOnboardingService,
    StudioEmailService,
    StudioReportsService,
    StudioMembersService,
    StudioTeamAuditService,
    StudioPlatformService,
    StudioPlatformBootstrapService,
    StudioTestAccountsBootstrapService,
    StudioTestAccountLeaseService,
    StudioPlatformAuthService,
    StudioPlatformManagersService,
    StudioQuotaWebhookService,
    PlatformPermissionGuard,
    StudioPlatformAccessService,
    StudioAdminEmailsService,
    StudioAdminNotificationService,
    StudioAccountDeleteService,
    StudioAccessService,
    StudioAuthGuard,
    StudioPermissionsGuard,
    StudioRoleGuard,
  ],
  exports: [
    StudioAuthService,
    StudioAccessService,
    StudioAuthGuard,
    StudioPermissionsGuard,
    StudioRoleGuard,
    StudioMembersService,
    StudioAccountService,
    StudioOnboardingService,
    StudioEmailService,
    StudioQuotaWebhookService,
    StudioAdminEmailsService,
    StudioAdminNotificationService,
    StudioPlatformBootstrapService,
    PlatformPermissionGuard,
    StudioPlatformAccessService,
  ],
})
export class StudioModule {}
