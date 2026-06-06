import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  apiSuccess,
  CreateActionDto,
  StudioPermission,
  UpdateActionDto,
} from '@ahmedrioueche/actocore-shared';
import { RequireStudioPermission } from '../studio/decorators/require-studio-permission.decorator';
import { StudioCtx } from '../studio/decorators/studio-context.decorator';
import { StudioAuthGuard } from '../studio/guards/studio-auth.guard';
import { StudioPermissionsGuard } from '../studio/guards/studio-permissions.guard';
import type { StudioRequestContext } from '../studio/studio-context';
import { StudioAccessService } from '../studio/studio-access.service';
import { assertStudioProjectRoute } from '../studio/studio-project-route.util';
import { ProjectsService } from '../projects/projects.service';
import { ActionsService } from './actions.service';

@UseGuards(StudioAuthGuard, StudioPermissionsGuard)
@Controller('web/projects/:projectId/actions')
export class ActionsController {
  constructor(
    private readonly actions: ActionsService,
    private readonly projects: ProjectsService,
    private readonly studioAccess: StudioAccessService,
  ) {}

  @Post()
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async create(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Body() body: CreateActionDto,
  ) {
    await assertStudioProjectRoute(
      ctx,
      projectId,
      this.studioAccess,
      this.projects,
    );
    return apiSuccess(await this.actions.create(projectId, body));
  }

  @Get()
  @RequireStudioPermission(StudioPermission.ACTIONS_READ)
  async list(
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
      await this.actions.listPaginated(projectId, {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      }),
    );
  }

  @Get(':actionId')
  @RequireStudioPermission(StudioPermission.ACTIONS_READ)
  async get(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Param('actionId') actionId: string,
  ) {
    await assertStudioProjectRoute(
      ctx,
      projectId,
      this.studioAccess,
      this.projects,
    );
    return apiSuccess(await this.actions.findById(projectId, actionId));
  }

  @Patch(':actionId')
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async update(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Param('actionId') actionId: string,
    @Body() body: UpdateActionDto,
  ) {
    await assertStudioProjectRoute(
      ctx,
      projectId,
      this.studioAccess,
      this.projects,
    );
    return apiSuccess(await this.actions.update(projectId, actionId, body));
  }

  @Delete(':actionId')
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async remove(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Param('actionId') actionId: string,
  ) {
    await assertStudioProjectRoute(
      ctx,
      projectId,
      this.studioAccess,
      this.projects,
    );
    return apiSuccess(await this.actions.remove(projectId, actionId));
  }
}
