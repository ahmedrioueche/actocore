import { Module, forwardRef } from '@nestjs/common';
import { BillingModule } from '../../billing/billing.module';
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

@Module({
  imports: [
    BillingModule,
    RedisModule,
    forwardRef(() => StudioModule),
    SessionsModule,
    OrchestratorModule,
    ProjectsModule,
    RequestContextModule,
  ],
  controllers: [
    MarketingChatController,
    MarketingSessionsController,
    MarketingRuntimeController,
  ],
  providers: [SdkChatService, MarketingChatGuard],
})
export class MarketingEntryModule {}
