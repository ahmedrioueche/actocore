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
  StudioSubscriptionModel,
  StudioSubscriptionSchema,
} from '../studio-billing/schemas/billing.schema';
import { StudioWebRateLimitInterceptor } from './interceptors/studio-web-rate-limit.interceptor';
import { StudioPlatformController } from './studio-platform.controller';
import { StudioPlatformService } from './studio-platform.service';
import { StudioQuotaWebhookService } from './studio-quota-webhook.service';
import { StudioAccountDeleteService } from './studio-account-delete.service';
import { StudioAccountController } from './studio-account.controller';
import { StudioAccountService } from './studio-account.service';
import { StudioOnboardingController } from './studio-onboarding.controller';
import { StudioOnboardingService } from './studio-onboarding.service';
import { StudioAuthController } from './studio-auth.controller';
import { StudioEmailService } from './studio-email.service';
import { StudioAccessService } from './studio-access.service';
import { StudioAuthService } from './studio-auth.service';
import { StudioMembersService } from './studio-members.service';
import { StudioTeamAuditService } from './studio-team-audit.service';
import {
  StudioTeamAudit,
  StudioTeamAuditSchema,
} from './schemas/studio-team-audit.schema';
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
      { name: Project.name, schema: ProjectSchema },
      { name: ApiKey.name, schema: ApiKeySchema },
      { name: ProjectAction.name, schema: ProjectActionSchema },
      { name: KnowledgeSource.name, schema: KnowledgeSourceSchema },
      { name: KnowledgeChunk.name, schema: KnowledgeChunkSchema },
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: UsageEvent.name, schema: UsageEventSchema },
      { name: StudioSubscriptionModel.name, schema: StudioSubscriptionSchema },
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
    StudioAccountController,
    StudioOnboardingController,
    StudioPlatformController,
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
    StudioMembersService,
    StudioTeamAuditService,
    StudioPlatformService,
    StudioQuotaWebhookService,
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
  ],
})
export class StudioModule {}
