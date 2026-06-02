import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { apiSuccess, type RuntimeConfigData } from '@ahmedrioueche/actocore-shared';
import type { VoiceResolvedConfig } from '../../config/voice.config';
import {
  ApiKeyGuard,
  type AuthenticatedRequest,
} from '../../auth/guards/api-key.guard';

@UseGuards(ApiKeyGuard)
@Controller('sdk/runtime')
export class SdkRuntimeController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  getConfig(@Req() request: AuthenticatedRequest) {
    const voice = this.config.get<VoiceResolvedConfig>('voice');
    const features = ['chat', 'sessions', 'voice'];
    const payload: RuntimeConfigData = {
      apiVersion: this.config.getOrThrow<string>('apiVersion'),
      features,
      projectId: request.apiKey!.projectId,
      voice: {
        serverTranscription: voice?.sttProvider === 'openai',
        sttProvider: voice?.sttProvider ?? 'stub',
      },
    };
    return apiSuccess(payload);
  }
}
