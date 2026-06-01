import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { LlmModule } from './external/llm/llm.module';
import { AuthModule } from './auth/auth.module';
import { EntryModule } from './entry/entry.module';
import { ProjectsModule } from './projects/projects.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    RedisModule,
    LlmModule,
    HealthModule,
    AuthModule,
    ProjectsModule,
    EntryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
