import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { apiSuccess, SendChatMessageDto } from '@ahmedrioueche/actocore-shared';
import type { RequestContextData } from '@ahmedrioueche/actocore-shared';
import { ApiKeyGuard } from '../../auth/guards/api-key.guard';
import { RequestContext } from '../../request-context/decorators/request-context.decorator';
import { SdkChatService } from './sdk-chat.service';

@UseGuards(ApiKeyGuard)
@Controller('sdk/chat')
export class SdkChatController {
  constructor(private readonly chat: SdkChatService) {}

  @Post()
  async sendMessage(
    @RequestContext() context: RequestContextData,
    @Body() body: SendChatMessageDto,
  ) {
    return apiSuccess(await this.chat.sendMessage(context, body));
  }
}
