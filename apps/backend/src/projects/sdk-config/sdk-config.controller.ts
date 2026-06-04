import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  apiSuccess,
  StudioPermission,
  UpdateSdkProjectConfigDto,
} from '@ahmedrioueche/actocore-shared';
import { RequireStudioPermission } from '../../studio/decorators/require-studio-permission.decorator';
import { StudioCtx } from '../../studio/decorators/studio-context.decorator';
import { StudioAuthGuard } from '../../studio/guards/studio-auth.guard';
import { StudioPermissionsGuard } from '../../studio/guards/studio-permissions.guard';
import type { StudioRequestContext } from '../../studio/studio-context';
import { StudioAccessService } from '../../studio/studio-access.service';
import { assertStudioProjectRoute } from '../../studio/studio-project-route.util';
import { ProjectsService } from '../projects.service';
import { SdkConfigService } from './sdk-config.service';

@UseGuards(StudioAuthGuard, StudioPermissionsGuard)
@Controller('web/projects/:projectId/sdk-config')
export class SdkConfigController {
  constructor(
    private readonly sdkConfig: SdkConfigService,
    private readonly projects: ProjectsService,
    private readonly studioAccess: StudioAccessService,
  ) {}

  @Get()
  @RequireStudioPermission(StudioPermission.SDK_CONFIG_READ)
  async get(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
  ) {
    await assertStudioProjectRoute(
      ctx,
      projectId,
      this.studioAccess,
      this.projects,
    );
    return apiSuccess(await this.sdkConfig.getConfig(projectId));
  }

  @Get('audit')
  @RequireStudioPermission(StudioPermission.SDK_CONFIG_READ)
  async listAudit(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
  ) {
    await assertStudioProjectRoute(
      ctx,
      projectId,
      this.studioAccess,
      this.projects,
    );
    const parsed = limit ? parseInt(limit, 10) : 50;
    return apiSuccess(
      await this.sdkConfig.listAudit(
        projectId,
        Number.isFinite(parsed) ? parsed : 50,
      ),
    );
  }

  @Patch()
  @RequireStudioPermission(StudioPermission.SDK_CONFIG_WRITE)
  async update(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Body() body: UpdateSdkProjectConfigDto,
  ) {
    await assertStudioProjectRoute(
      ctx,
      projectId,
      this.studioAccess,
      this.projects,
    );
    return apiSuccess(await this.sdkConfig.updateConfig(projectId, body));
  }
}
