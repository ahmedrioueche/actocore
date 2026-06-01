import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { apiSuccess } from '@ahmedrioueche/actocore-shared';
import { ApiKeyGuard } from '../../auth/guards/api-key.guard';

@UseGuards(ApiKeyGuard)
@Controller('sdk/runtime')
export class SdkRuntimeController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  getConfig() {
    return apiSuccess({
      apiVersion: this.config.getOrThrow<string>('apiVersion'),
      features: ['chat', 'sessions'],
    });
  }
}
