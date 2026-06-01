import { Module } from '@nestjs/common';
import { SdkEntryModule } from './sdk/sdk.module';

@Module({
  imports: [SdkEntryModule],
})
export class EntryModule {}
