import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { apiSuccess, type RuntimeConfigData } from '@ahmedrioueche/actocore-shared';
import { Public } from '../../auth/decorators/public.decorator';
import { ProjectId } from '../../auth/decorators/project-id.decorator';
import type { VoiceResolvedConfig } from '../../config/voice.config';
import { SdkConfigService } from '../../projects/sdk-config/sdk-config.service';
import { MarketingChatGuard } from './marketing-chat.guard';

@Public()
@UseGuards(MarketingChatGuard)
@Controller('marketing/sdk/runtime')
export class MarketingRuntimeController {
  constructor(
    private readonly config: ConfigService,
    private readonly sdkConfig: SdkConfigService,
  ) {}

  @Get()
  async getConfig(@ProjectId() projectId: string) {
    const voice = this.config.get<VoiceResolvedConfig>('voice');
    const sdk = await this.sdkConfig.getConfig(projectId);

    const payload: RuntimeConfigData = {
      apiVersion: this.config.getOrThrow<string>('apiVersion'),
      features: ['chat', 'sessions', 'sdk-config'],
      projectId,
      voice: {
        serverTranscription: false,
        sttProvider: voice?.sttProvider ?? 'stub',
      },
      sdk,
    };
    return apiSuccess(payload);
  }
}
