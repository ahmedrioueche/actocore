import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProjectAction,
  ProjectActionSchema,
} from '../actions/schemas/project-action.schema';
import { AuthModule } from '../auth/auth.module';
import { ApiKey, ApiKeySchema } from '../auth/schemas/api-key.schema';
import { KnowledgeStorageService } from '../knowledge/knowledge-storage.service';
import {
  KnowledgeChunk,
  KnowledgeChunkSchema,
} from '../knowledge/schemas/knowledge-chunk.schema';
import {
  KnowledgeSource,
  KnowledgeSourceSchema,
} from '../knowledge/schemas/knowledge-source.schema';
import {
  ChatMessage,
  ChatMessageSchema,
} from '../sessions/schemas/chat-message.schema';
import {
  ChatSession,
  ChatSessionSchema,
} from '../sessions/schemas/chat-session.schema';
import { LlmModule } from '../external/llm/llm.module';
import { SessionsModule } from '../sessions/sessions.module';
import { StudioBillingModule } from '../studio-billing/studio-billing.module';
import {
  StudioMembership,
  StudioMembershipSchema,
} from '../studio/schemas/studio-membership.schema';
import { StudioModule } from '../studio/studio.module';
import {
  UsageEvent,
  UsageEventSchema,
} from '../usage/schemas/usage-event.schema';
import { ProjectDeleteService } from './project-delete.service';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project, ProjectSchema } from './schemas/project.schema';
import {
  SdkConfigAudit,
  SdkConfigAuditSchema,
} from './schemas/sdk-config-audit.schema';
import { SdkConfigAuditLogger } from './sdk-config/sdk-config-audit.logger';
import { SdkConfigController } from './sdk-config/sdk-config.controller';
import { SdkConfigService } from './sdk-config/sdk-config.service';
import { SdkConfigTranslateService } from './sdk-config/sdk-config-translate.service';

@Module({
  imports: [
    forwardRef(() => StudioModule),
    forwardRef(() => StudioBillingModule),
    forwardRef(() => AuthModule),
    SessionsModule,
    LlmModule,
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: SdkConfigAudit.name, schema: SdkConfigAuditSchema },
      { name: ApiKey.name, schema: ApiKeySchema },
      { name: ProjectAction.name, schema: ProjectActionSchema },
      { name: KnowledgeSource.name, schema: KnowledgeSourceSchema },
      { name: KnowledgeChunk.name, schema: KnowledgeChunkSchema },
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: UsageEvent.name, schema: UsageEventSchema },
      { name: StudioMembership.name, schema: StudioMembershipSchema },
    ]),
  ],
  controllers: [ProjectsController, SdkConfigController],
  providers: [
    ProjectsService,
    ProjectDeleteService,
    SdkConfigService,
    SdkConfigTranslateService,
    SdkConfigAuditLogger,
    KnowledgeStorageService,
  ],
  exports: [ProjectsService, SdkConfigService, ProjectDeleteService],
})
export class ProjectsModule {}
