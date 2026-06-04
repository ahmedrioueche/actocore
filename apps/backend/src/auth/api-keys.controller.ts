import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  apiSuccess,
  CreateApiKeyDto,
  StudioPermission,
} from '@ahmedrioueche/actocore-shared';
import { RequireStudioPermission } from '../studio/decorators/require-studio-permission.decorator';
import { StudioCtx } from '../studio/decorators/studio-context.decorator';
import { StudioAuthGuard } from '../studio/guards/studio-auth.guard';
import { StudioPermissionsGuard } from '../studio/guards/studio-permissions.guard';
import type { StudioRequestContext } from '../studio/studio-context';
import { assertStudioProjectRoute } from '../studio/studio-project-route.util';
import { StudioAccessService } from '../studio/studio-access.service';
import { ProjectsService } from '../projects/projects.service';
import { ApiKeysService } from './api-keys.service';

@UseGuards(StudioAuthGuard, StudioPermissionsGuard)
@Controller('web/api-keys')
export class ApiKeysController {
  constructor(
    private readonly apiKeys: ApiKeysService,
    private readonly projects: ProjectsService,
    private readonly studioAccess: StudioAccessService,
  ) {}

  @Post()
  @RequireStudioPermission(StudioPermission.API_KEYS_WRITE)
  async issue(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Body() body: CreateApiKeyDto,
  ) {
    await assertStudioProjectRoute(
      ctx,
      body.projectId,
      this.studioAccess,
      this.projects,
    );
    return apiSuccess(await this.apiKeys.issue(body));
  }

  @Delete(':keyId')
  @HttpCode(200)
  @RequireStudioPermission(StudioPermission.API_KEYS_WRITE)
  async revoke(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('keyId') keyId: string,
  ) {
    return apiSuccess(await this.apiKeys.revoke(ctx, keyId));
  }
}
