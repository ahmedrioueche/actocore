import { Body, Controller, Delete, HttpCode, Param, Post } from '@nestjs/common';
import {
  apiSuccess,
  CreateApiKeyDto,
} from '@ahmedrioueche/actocore-shared';
import { Public } from './decorators/public.decorator';
import { ApiKeysService } from './api-keys.service';

/** Studio control plane — dashboard auth will be added later. */
@Public()
@Controller('web/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @Post()
  async issue(@Body() body: CreateApiKeyDto) {
    return apiSuccess(await this.apiKeys.issue(body));
  }

  @Delete(':keyId')
  @HttpCode(200)
  async revoke(@Param('keyId') keyId: string) {
    return apiSuccess(await this.apiKeys.revoke(keyId));
  }
}
