import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { LlmModule } from './external/llm/llm.module';
import { AuthModule } from './auth/auth.module';
import { StudioModule } from './studio/studio.module';
import { EntryModule } from './entry/entry.module';
import { ActionsModule } from './actions/actions.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { ProjectsModule } from './projects/projects.module';
import { HealthModule } from './health/health.module';
import { ObservabilityModule } from './observability/observability.module';
import { RedisModule } from './redis/redis.module';
import { UsageModule } from './usage/usage.module';
import { StudioBillingModule } from './studio-billing/studio-billing.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    ObservabilityModule,
    RedisModule,
    LlmModule,
    HealthModule,
    AuthModule,
    StudioModule,
    StudioBillingModule,
    ProjectsModule,
    ActionsModule,
    KnowledgeModule,
    UsageModule,
    EntryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
