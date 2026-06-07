import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  Logger,
  Post,
} from '@nestjs/common';
import { StudioPublic } from '../studio/decorators/studio-public.decorator';
import type { PayPalWebhookPayload } from './paypal-webhook.types';
import { StudioPayPalService } from './studio-paypal.service';

@Controller('web/billing/paypal')
export class StudioPayPalWebhookController {
  private readonly logger = new Logger(StudioPayPalWebhookController.name);

  constructor(private readonly paypal: StudioPayPalService) {}

  @StudioPublic()
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Headers() headers: Record<string, string | undefined>,
    @Body() event: PayPalWebhookPayload,
  ) {
    const verified = await this.paypal.verifyWebhookSignature(headers, event);
    if (!verified) {
      throw new ForbiddenException('Invalid PayPal webhook signature');
    }

    if (!event.event_type) {
      throw new BadRequestException('PayPal webhook missing event_type');
    }

    try {
      await this.paypal.handleWebhookPayload(event);
    } catch (error) {
      this.logger.error('PayPal webhook handler error', error);
    }
    return { received: true };
  }
}
