import { Module } from '@nestjs/common';
import { SdkEntryModule } from './sdk/sdk.module';
import { MarketingEntryModule } from './marketing/marketing.module';

@Module({
  imports: [SdkEntryModule, MarketingEntryModule],
})
export class EntryModule {}
