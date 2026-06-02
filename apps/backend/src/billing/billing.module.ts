import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { UsageModule } from '../usage/usage.module';
import { ChatQuotaGuard } from './guards/chat-quota.guard';
import { QuotaService } from './quota.service';

@Module({
  imports: [RedisModule, UsageModule],
  providers: [QuotaService, ChatQuotaGuard],
  exports: [QuotaService, ChatQuotaGuard],
})
export class BillingModule {}
