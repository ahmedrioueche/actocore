import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { apiSuccess, type RuntimeConfigData } from '@ahmedrioueche/actocore-shared';
import type { VoiceResolvedConfig } from '../../config/voice.config';
import {
  ApiKeyGuard,
  type AuthenticatedRequest,
} from '../../auth/guards/api-key.guard';
import { SdkConfigService } from '../../projects/sdk-config/sdk-config.service';
import { AppPagesService } from '../../actions/app-pages.service';

@UseGuards(ApiKeyGuard)
@Controller('sdk/runtime')
export class SdkRuntimeController {
  constructor(
    private readonly config: ConfigService,
    private readonly sdkConfig: SdkConfigService,
    private readonly appPages: AppPagesService,
  ) {}

  @Get()
  async getConfig(@Req() request: AuthenticatedRequest) {
    const voice = this.config.get<VoiceResolvedConfig>('voice');
    const projectId = request.apiKey!.projectId;
    const [sdk, pages] = await Promise.all([
      this.sdkConfig.getConfig(projectId),
      this.appPages.listManifest(projectId),
    ]);

    const payload: RuntimeConfigData = {
      apiVersion: this.config.getOrThrow<string>('apiVersion'),
      features: ['chat', 'sessions', 'voice', 'sdk-config'],
      projectId,
      voice: {
        serverTranscription: voice?.sttProvider === 'openai',
        sttProvider: voice?.sttProvider ?? 'stub',
      },
      sdk,
      pages: pages.length > 0 ? pages : undefined,
    };
    return apiSuccess(payload);
  }
}
