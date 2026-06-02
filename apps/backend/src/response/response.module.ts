import { Module } from '@nestjs/common';
import { ChatResponseFormatter } from './chat-response.formatter';

@Module({
  providers: [ChatResponseFormatter],
  exports: [ChatResponseFormatter],
})
export class ResponseModule {}
