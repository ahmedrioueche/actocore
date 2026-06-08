import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { StudioModule } from '../studio/studio.module';
import { ProjectsModule } from '../projects/projects.module';
import {
  StudioAccount,
  StudioAccountSchema,
} from '../studio/schemas/studio-account.schema';
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
import { UsageEvent, UsageEventSchema } from './schemas/usage-event.schema';
import { PlatformPermissionGuard } from '../studio/guards/platform-permission.guard';
import { UsageAdminController } from './usage-admin.controller';
import { UsageService } from './usage.service';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => StudioModule),
    MongooseModule.forFeature([
      { name: UsageEvent.name, schema: UsageEventSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: StudioAccount.name, schema: StudioAccountSchema },
      { name: KnowledgeSource.name, schema: KnowledgeSourceSchema },
      { name: KnowledgeChunk.name, schema: KnowledgeChunkSchema },
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
    forwardRef(() => ProjectsModule),
  ],
  controllers: [UsageAdminController],
  providers: [UsageService, PlatformPermissionGuard],
  exports: [UsageService],
})
export class UsageModule {}
