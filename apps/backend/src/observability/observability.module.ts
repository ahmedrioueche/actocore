import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AiDecisionLogger } from './ai-decision.logger';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

@Module({
  providers: [
    AiDecisionLogger,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
  exports: [AiDecisionLogger],
})
export class ObservabilityModule {}
