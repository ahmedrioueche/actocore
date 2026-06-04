import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { StudioPublic } from '../studio/decorators/studio-public.decorator';
import { StudioPaddleService } from './studio-paddle.service';

@Controller('web/billing/paddle')
export class StudioPaddleWebhookController {
  private readonly logger = new Logger(StudioPaddleWebhookController.name);

  constructor(private readonly paddle: StudioPaddleService) {}

  @StudioPublic()
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Headers('paddle-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() event: { event_id?: string; event_type: string; data: Record<string, unknown> },
  ) {
    if (!signature) {
      throw new BadRequestException('Paddle-Signature header is missing');
    }
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw body is missing for webhook verification');
    }
    if (!this.paddle.verifyWebhookSignature(signature, rawBody.toString())) {
      throw new ForbiddenException('Invalid Paddle webhook signature');
    }

    try {
      await this.paddle.handleWebhookPayload(event);
    } catch (error) {
      this.logger.error('Paddle webhook handler error', error);
    }
    return { received: true };
  }
}
