import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from '../../auth/auth.module';
import { BillingModule } from '../../billing/billing.module';
import { OrchestratorModule } from '../../orchestrator/orchestrator.module';
import { ProjectsModule } from '../../projects/projects.module';
import { RequestContextInterceptor } from '../../request-context/request-context.interceptor';
import { RequestContextModule } from '../../request-context/request-context.module';
import { SessionsModule } from '../../sessions/sessions.module';
import { SdkChatController } from './sdk-chat.controller';
import { SdkChatService } from './sdk-chat.service';
import { SdkRuntimeController } from './sdk-runtime.controller';
import { SdkSessionsController } from './sdk-sessions.controller';

@Module({
  imports: [
    AuthModule,
    BillingModule,
    SessionsModule,
    OrchestratorModule,
    ProjectsModule,
    RequestContextModule,
  ],
  controllers: [
    SdkChatController,
    SdkSessionsController,
    SdkRuntimeController,
  ],
  providers: [
    SdkChatService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
  ],
})
export class SdkEntryModule {}
