import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import {
  apiSuccess,
  ImportAppLayoutDto,
  StudioPermission,
} from '@ahmedrioueche/actocore-shared';
import { RequireStudioPermission } from '../studio/decorators/require-studio-permission.decorator';
import { StudioCtx } from '../studio/decorators/studio-context.decorator';
import { StudioAuthGuard } from '../studio/guards/studio-auth.guard';
import { StudioPermissionsGuard } from '../studio/guards/studio-permissions.guard';
import type { StudioRequestContext } from '../studio/studio-context';
import { StudioAccessService } from '../studio/studio-access.service';
import { assertStudioProjectRoute } from '../studio/studio-project-route.util';
import { ProjectsService } from '../projects/projects.service';
import { AppLayoutImportService } from './app-layout-import.service';

@UseGuards(StudioAuthGuard, StudioPermissionsGuard)
@Controller('web/projects/:projectId/app-layout')
export class AppLayoutController {
  constructor(
    private readonly importService: AppLayoutImportService,
    private readonly projects: ProjectsService,
    private readonly studioAccess: StudioAccessService,
  ) {}

  @Post('import')
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async importLayout(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Body() body: ImportAppLayoutDto,
  ) {
    await this.assertRoute(ctx, projectId);
    return apiSuccess(await this.importService.importLayout(projectId, body));
  }

  private assertRoute(
    ctx: StudioRequestContext | null,
    projectId: string,
  ): Promise<void> {
    return assertStudioProjectRoute(
      ctx,
      projectId,
      this.studioAccess,
      this.projects,
    );
  }
}
