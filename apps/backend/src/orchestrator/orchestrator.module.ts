import { Module } from '@nestjs/common';
import { ActionsModule } from '../actions/actions.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { ObservabilityModule } from '../observability/observability.module';
import { ResponseModule } from '../response/response.module';
import { UsageModule } from '../usage/usage.module';
import { SessionsModule } from '../sessions/sessions.module';
import { LlmModule } from '../external/llm/llm.module';
import { ChatOrchestratorService } from './chat-orchestrator.service';
import { INTENT_CLASSIFIER } from './intent-classifier.interface';
import { StubIntentClassifier } from './stub-intent.classifier';

@Module({
  imports: [
    ActionsModule,
    KnowledgeModule,
    LlmModule,
    ObservabilityModule,
    ResponseModule,
    SessionsModule,
    UsageModule,
  ],
  providers: [
    ChatOrchestratorService,
    StubIntentClassifier,
    { provide: INTENT_CLASSIFIER, useExisting: StubIntentClassifier },
  ],
  exports: [ChatOrchestratorService],
})
export class OrchestratorModule {}
