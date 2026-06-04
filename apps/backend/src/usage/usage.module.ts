import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudioModule } from '../studio/studio.module';
import { ProjectsModule } from '../projects/projects.module';
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
import { UsageAdminController } from './usage-admin.controller';
import { UsageService } from './usage.service';

@Module({
  imports: [
    forwardRef(() => StudioModule),
    MongooseModule.forFeature([
      { name: UsageEvent.name, schema: UsageEventSchema },
      { name: KnowledgeSource.name, schema: KnowledgeSourceSchema },
      { name: KnowledgeChunk.name, schema: KnowledgeChunkSchema },
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
    forwardRef(() => ProjectsModule),
  ],
  controllers: [UsageAdminController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}
