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
  AssignAppPageActionsDto,
  CreateAppPageDto,
  CreateAppPageFunctionalityDto,
  ReorderAppPagesDto,
  StudioPermission,
  UpdateAppPageDto,
  UpdateAppPageFunctionalityDto,
  UpdateAppPageGraphLayoutDto,
} from '@ahmedrioueche/actocore-shared';
import { RequireStudioPermission } from '../studio/decorators/require-studio-permission.decorator';
import { StudioCtx } from '../studio/decorators/studio-context.decorator';
import { StudioAuthGuard } from '../studio/guards/studio-auth.guard';
import { StudioPermissionsGuard } from '../studio/guards/studio-permissions.guard';
import type { StudioRequestContext } from '../studio/studio-context';
import { StudioAccessService } from '../studio/studio-access.service';
import { assertStudioProjectRoute } from '../studio/studio-project-route.util';
import { ProjectsService } from '../projects/projects.service';
import { AppPagesService } from './app-pages.service';

@UseGuards(StudioAuthGuard, StudioPermissionsGuard)
@Controller('web/projects/:projectId/app-pages')
export class AppPagesController {
  constructor(
    private readonly pages: AppPagesService,
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
    return apiSuccess(await this.pages.list(projectId));
  }

  @Post()
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async create(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Body() body: CreateAppPageDto,
  ) {
    await this.assertRoute(ctx, projectId);
    return apiSuccess(await this.pages.create(projectId, body));
  }

  @Patch('reorder')
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async reorder(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Body() body: ReorderAppPagesDto,
  ) {
    await this.assertRoute(ctx, projectId);
    return apiSuccess(await this.pages.reorder(projectId, body.pageIds));
  }

  @Patch('graph-layout')
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async updateGraphLayout(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Body() body: UpdateAppPageGraphLayoutDto,
  ) {
    await this.assertRoute(ctx, projectId);
    return apiSuccess(await this.pages.updateGraphLayout(projectId, body));
  }

  @Patch(':pageId/actions')
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async assignActions(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Param('pageId') pageId: string,
    @Body() body: AssignAppPageActionsDto,
  ) {
    await this.assertRoute(ctx, projectId);
    return apiSuccess(await this.pages.assignActions(projectId, pageId, body));
  }

  @Post(':pageId/functionalities')
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async createFunctionality(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Param('pageId') pageId: string,
    @Body() body: CreateAppPageFunctionalityDto,
  ) {
    await this.assertRoute(ctx, projectId);
    return apiSuccess(
      await this.pages.createFunctionality(projectId, pageId, body),
    );
  }

  @Patch(':pageId/functionalities/:functionalityId')
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async updateFunctionality(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Param('pageId') pageId: string,
    @Param('functionalityId') functionalityId: string,
    @Body() body: UpdateAppPageFunctionalityDto,
  ) {
    await this.assertRoute(ctx, projectId);
    return apiSuccess(
      await this.pages.updateFunctionality(
        projectId,
        pageId,
        functionalityId,
        body,
      ),
    );
  }

  @Delete(':pageId/functionalities/:functionalityId')
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async removeFunctionality(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Param('pageId') pageId: string,
    @Param('functionalityId') functionalityId: string,
  ) {
    await this.assertRoute(ctx, projectId);
    return apiSuccess(
      await this.pages.removeFunctionality(
        projectId,
        pageId,
        functionalityId,
      ),
    );
  }

  @Patch(':pageId')
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async update(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Param('pageId') pageId: string,
    @Body() body: UpdateAppPageDto,
  ) {
    await this.assertRoute(ctx, projectId);
    return apiSuccess(await this.pages.update(projectId, pageId, body));
  }

  @Delete(':pageId')
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async remove(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Param('pageId') pageId: string,
  ) {
    await this.assertRoute(ctx, projectId);
    return apiSuccess(await this.pages.remove(projectId, pageId));
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
