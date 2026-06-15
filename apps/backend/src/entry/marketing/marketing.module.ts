import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingModule } from '../../billing/billing.module';
import { ActionsModule } from '../../actions/actions.module';
import { AuthModule } from '../../auth/auth.module';
import { KnowledgeModule } from '../../knowledge/knowledge.module';
import { ProjectsModule } from '../../projects/projects.module';
import { RedisModule } from '../../redis/redis.module';
import { RequestContextModule } from '../../request-context/request-context.module';
import { SessionsModule } from '../../sessions/sessions.module';
import { SdkChatService } from '../sdk/sdk-chat.service';
import { OrchestratorModule } from '../../orchestrator/orchestrator.module';
import { StudioModule } from '../../studio/studio.module';
import { MarketingChatController } from './marketing-chat.controller';
import { MarketingChatGuard } from './marketing-chat.guard';
import { MarketingRuntimeController } from './marketing-runtime.controller';
import { MarketingSessionsController } from './marketing-sessions.controller';
import { PlaygroundBootstrapController } from './playground/playground-bootstrap.controller';
import { PlaygroundCleanupService } from './playground/playground-cleanup.service';
import { PlaygroundProjectsController } from './playground/playground-projects.controller';
import {
  PlaygroundBootstrapGuard,
  PlaygroundGuard,
} from './playground/playground.guard';
import { PlaygroundService } from './playground/playground.service';
import {
  PlaygroundSession,
  PlaygroundSessionSchema,
} from './playground/schemas/playground-session.schema';

@Module({
  imports: [
    BillingModule,
    RedisModule,
    AuthModule,
    KnowledgeModule,
    forwardRef(() => StudioModule),
    SessionsModule,
    ActionsModule,
    OrchestratorModule,
    ProjectsModule,
    RequestContextModule,
    MongooseModule.forFeature([
      { name: PlaygroundSession.name, schema: PlaygroundSessionSchema },
    ]),
  ],
  controllers: [
    MarketingChatController,
    MarketingSessionsController,
    MarketingRuntimeController,
    PlaygroundBootstrapController,
    PlaygroundProjectsController,
  ],
  providers: [
    SdkChatService,
    MarketingChatGuard,
    PlaygroundService,
    PlaygroundGuard,
    PlaygroundBootstrapGuard,
    PlaygroundCleanupService,
  ],
})
export class MarketingEntryModule {}
