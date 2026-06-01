import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from '../../auth/auth.module';
import { LlmModule } from '../../external/llm/llm.module';
import { RequestContextInterceptor } from '../../request-context/request-context.interceptor';
import { ProjectsModule } from '../../projects/projects.module';
import { RequestContextModule } from '../../request-context/request-context.module';
import { SdkChatController } from './sdk-chat.controller';
import { SdkChatService } from './sdk-chat.service';
import { SdkRuntimeController } from './sdk-runtime.controller';
import { SdkSessionsController } from './sdk-sessions.controller';
import { SdkSessionStore } from './sdk-session.store';

@Module({
  imports: [AuthModule, LlmModule, ProjectsModule, RequestContextModule],
  controllers: [
    SdkChatController,
    SdkSessionsController,
    SdkRuntimeController,
  ],
  providers: [
    SdkSessionStore,
    SdkChatService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
  ],
})
export class SdkEntryModule {}
