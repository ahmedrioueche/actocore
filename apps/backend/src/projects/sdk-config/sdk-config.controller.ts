import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  apiSuccess,
  StudioPermission,
  TranslateSdkCopyDto,
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
import { SdkConfigTranslateService } from './sdk-config-translate.service';

@UseGuards(StudioAuthGuard, StudioPermissionsGuard)
@Controller('web/projects/:projectId/sdk-config')
export class SdkConfigController {
  constructor(
    private readonly sdkConfig: SdkConfigService,
    private readonly sdkConfigTranslate: SdkConfigTranslateService,
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
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    await assertStudioProjectRoute(
      ctx,
      projectId,
      this.studioAccess,
      this.projects,
    );
    return apiSuccess(
      await this.sdkConfig.listAuditPaginated(projectId, {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      }),
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

  @Post('translate-copy')
  @RequireStudioPermission(StudioPermission.SDK_CONFIG_WRITE)
  async translateCopy(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Body() body: TranslateSdkCopyDto,
  ) {
    await assertStudioProjectRoute(
      ctx,
      projectId,
      this.studioAccess,
      this.projects,
    );
    return apiSuccess(await this.sdkConfigTranslate.translateCopy(body));
  }
}
