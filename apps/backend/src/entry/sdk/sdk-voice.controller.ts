import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { apiSuccess } from '@ahmedrioueche/actocore-shared';
import {
  ApiKeyGuard,
} from '../../auth/guards/api-key.guard';
import { SdkVoiceService } from './sdk-voice.service';

@UseGuards(ApiKeyGuard)
@Controller('sdk/voice')
export class SdkVoiceController {
  constructor(private readonly voice: SdkVoiceService) {}

  @Post('transcribe')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async transcribe(
    @UploadedFile() file: Express.Multer.File,
    @Query('language') language?: string,
  ) {
    return apiSuccess(await this.voice.transcribe(file, language));
  }
}
