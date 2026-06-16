import {
  Body,
  Controller,
  InternalServerErrorException,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { apiSuccess, ContactInquiryDto } from '@ahmedrioueche/actocore-shared';
import { StudioPublic } from './decorators/studio-public.decorator';
import { StudioAuthGuard } from './guards/studio-auth.guard';
import { StudioPermissionsGuard } from './guards/studio-permissions.guard';
import { StudioEmailService } from './studio-email.service';

@Controller('web/contact')
@UseGuards(StudioAuthGuard, StudioPermissionsGuard)
export class StudioContactController {
  private readonly logger = new Logger(StudioContactController.name);

  constructor(private readonly email: StudioEmailService) {}

  @Post()
  @StudioPublic()
  async submit(@Body() body: ContactInquiryDto) {
    try {
      await this.email.sendContactInquiry(body);
      return apiSuccess({ sent: true });
    } catch (err) {
      this.logger.error('Contact inquiry email failed', err);
      throw new InternalServerErrorException(
        'Failed to send your message. Please try again later.',
      );
    }
  }
}
