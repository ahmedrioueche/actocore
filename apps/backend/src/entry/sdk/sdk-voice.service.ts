import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { VoiceTranscriptionData } from '@ahmedrioueche/actocore-shared';
import type { VoiceResolvedConfig } from '../../config/voice.config';
import {
  STT_PROVIDER,
  type SttProvider,
} from '../../external/voice/stt-provider.interface';
import { mapLlmProviderError } from '../../external/llm/llm-provider-error.util';

const ALLOWED_MIME = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/m4a',
  'video/webm',
]);

@Injectable()
export class SdkVoiceService {
  private readonly logger = new Logger(SdkVoiceService.name);

  constructor(
    @Inject(STT_PROVIDER) private readonly stt: SttProvider,
    private readonly config: ConfigService,
  ) {}

  async transcribe(
    file: Express.Multer.File | undefined,
    language?: string,
  ): Promise<VoiceTranscriptionData> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('audio file is required');
    }

    const voice = this.config.getOrThrow<VoiceResolvedConfig>('voice');
    if (file.size > voice.maxAudioBytes) {
      throw new PayloadTooLargeException(
        `Audio exceeds maximum size of ${voice.maxAudioBytes} bytes`,
      );
    }

    const mimeType = (file.mimetype || 'audio/webm').toLowerCase();
    if (!ALLOWED_MIME.has(mimeType)) {
      throw new BadRequestException(
        `Unsupported audio type: ${mimeType}. Use webm, ogg, mp3, wav, or m4a.`,
      );
    }

    try {
      const text = await this.stt.transcribe({
        audio: file.buffer,
        mimeType,
        language,
      });

      return {
        text,
        provider: voice.sttProvider,
        language: language?.trim() || undefined,
      };
    } catch (error) {
      throw mapLlmProviderError('Speech', error, this.logger);
    }
  }
}
