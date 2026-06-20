import { Module, forwardRef } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from '../../auth/auth.module';
import { BillingModule } from '../../billing/billing.module';
import { ActionsModule } from '../../actions/actions.module';
import { OrchestratorModule } from '../../orchestrator/orchestrator.module';
import { VoiceModule } from '../../external/voice/voice.module';
import { ProjectsModule } from '../../projects/projects.module';
import { RequestContextInterceptor } from '../../request-context/request-context.interceptor';
import { RequestContextModule } from '../../request-context/request-context.module';
import { SessionsModule } from '../../sessions/sessions.module';
import { SdkChatController } from './sdk-chat.controller';
import { SdkChatService } from './sdk-chat.service';
import { SdkActionsController } from './sdk-actions.controller';
import { SdkManifestController } from './sdk-manifest.controller';
import { SdkRuntimeController } from './sdk-runtime.controller';
import { SdkSessionsController } from './sdk-sessions.controller';
import { SdkVoiceController } from './sdk-voice.controller';
import { SdkVoiceService } from './sdk-voice.service';
import { StudioModule } from '../../studio/studio.module';

@Module({
  imports: [
    AuthModule,
    BillingModule,
    forwardRef(() => StudioModule),
    SessionsModule,
    ActionsModule,
    OrchestratorModule,
    VoiceModule,
    ProjectsModule,
    RequestContextModule,
  ],
  controllers: [
    SdkChatController,
    SdkSessionsController,
    SdkRuntimeController,
    SdkManifestController,
    SdkActionsController,
    SdkVoiceController,
  ],
  providers: [
    SdkChatService,
    SdkVoiceService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
  ],
})
export class SdkEntryModule {}
