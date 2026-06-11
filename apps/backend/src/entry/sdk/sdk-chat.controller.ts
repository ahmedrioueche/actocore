import {
  Body,
  Controller,
  HttpException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  apiSuccess,
  SendChatMessageDto,
  type ChatStreamEvent,
} from '@ahmedrioueche/actocore-shared';
import type { RequestContextData } from '@ahmedrioueche/actocore-shared';
import type { Request, Response } from 'express';
import { ApiKeyGuard } from '../../auth/guards/api-key.guard';
import { ChatQuotaGuard } from '../../billing/guards/chat-quota.guard';
import { RequestContext } from '../../request-context/decorators/request-context.decorator';
import { SdkChatService } from './sdk-chat.service';

@UseGuards(ApiKeyGuard, ChatQuotaGuard)
@Controller('sdk/chat')
export class SdkChatController {
  constructor(private readonly chat: SdkChatService) {}

  @Post('stream')
  async streamMessage(
    @RequestContext() context: RequestContextData,
    @Body() body: SendChatMessageDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const abortController = new AbortController();
    const onClose = () => abortController.abort();
    req.on('close', onClose);

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    req.socket?.setNoDelay?.(true);

    const flushable = res as Response & { flush?: () => void };
    const writeQueue: ChatStreamEvent[] = [];
    let writePending = false;

    const drainWriteQueue = () => {
      if (writePending || writeQueue.length === 0) return;
      writePending = true;
      const event = writeQueue.shift()!;
      res.write(`data: ${JSON.stringify(event)}\n\n`, () => {
        writePending = false;
        flushable.flush?.();
        drainWriteQueue();
      });
      flushable.flush?.();
    };

    const writeEvent = (event: ChatStreamEvent) => {
      writeQueue.push(event);
      drainWriteQueue();
    };

    try {
      await this.chat.streamMessage(
        context,
        body,
        writeEvent,
        abortController.signal,
      );
    } catch (error) {
      if (!abortController.signal.aborted) {
        const payload =
          error instanceof HttpException &&
          typeof error.getResponse() === 'object' &&
          error.getResponse() !== null
            ? (error.getResponse() as {
                errorCode?: string;
                message?: string;
              })
            : undefined;
        writeEvent({
          type: 'error',
          errorCode: payload?.errorCode ?? 'INTERNAL_ERROR',
          message: payload?.message ?? 'Stream failed',
        });
      }
    } finally {
      req.off('close', onClose);
      res.end();
    }
  }

  @Post()
  async sendMessage(
    @RequestContext() context: RequestContextData,
    @Body() body: SendChatMessageDto,
  ) {
    return apiSuccess(await this.chat.sendMessage(context, body));
  }
}
