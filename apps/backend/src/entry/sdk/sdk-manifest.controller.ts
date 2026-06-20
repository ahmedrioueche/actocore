import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { apiSuccess } from '@ahmedrioueche/actocore-shared';
import {
  ApiKeyGuard,
  type AuthenticatedRequest,
} from '../../auth/guards/api-key.guard';
import { SdkManifestService } from '../../actions/sdk-manifest.service';

@UseGuards(ApiKeyGuard)
@Controller('sdk/manifest')
export class SdkManifestController {
  constructor(private readonly manifest: SdkManifestService) {}

  @Get()
  async getManifest(@Req() request: AuthenticatedRequest) {
    const projectId = request.apiKey!.projectId;
    return apiSuccess(await this.manifest.buildManifest(projectId));
  }
}
