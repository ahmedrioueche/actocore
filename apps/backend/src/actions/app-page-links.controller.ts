import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  apiSuccess,
  CreateAppPageLinkDto,
  StudioPermission,
  UpdateAppPageLinkDto,
} from '@ahmedrioueche/actocore-shared';
import { RequireStudioPermission } from '../studio/decorators/require-studio-permission.decorator';
import { StudioCtx } from '../studio/decorators/studio-context.decorator';
import { StudioAuthGuard } from '../studio/guards/studio-auth.guard';
import { StudioPermissionsGuard } from '../studio/guards/studio-permissions.guard';
import type { StudioRequestContext } from '../studio/studio-context';
import { StudioAccessService } from '../studio/studio-access.service';
import { assertStudioProjectRoute } from '../studio/studio-project-route.util';
import { ProjectsService } from '../projects/projects.service';
import { AppPageLinksService } from './app-page-links.service';

@UseGuards(StudioAuthGuard, StudioPermissionsGuard)
@Controller('web/projects/:projectId/app-page-links')
export class AppPageLinksController {
  constructor(
    private readonly links: AppPageLinksService,
    private readonly projects: ProjectsService,
    private readonly studioAccess: StudioAccessService,
  ) {}

  @Get()
  @RequireStudioPermission(StudioPermission.ACTIONS_READ)
  async list(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
  ) {
    await this.assertRoute(ctx, projectId);
    return apiSuccess(await this.links.list(projectId));
  }

  @Post()
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async create(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Body() body: CreateAppPageLinkDto,
  ) {
    await this.assertRoute(ctx, projectId);
    return apiSuccess(await this.links.create(projectId, body));
  }

  @Patch(':linkId')
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async update(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Param('linkId') linkId: string,
    @Body() body: UpdateAppPageLinkDto,
  ) {
    await this.assertRoute(ctx, projectId);
    return apiSuccess(await this.links.update(projectId, linkId, body));
  }

  @Delete(':linkId')
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async remove(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Param('linkId') linkId: string,
  ) {
    await this.assertRoute(ctx, projectId);
    return apiSuccess(await this.links.remove(projectId, linkId));
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
