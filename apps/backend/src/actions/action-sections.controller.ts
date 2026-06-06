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
  CreateActionSectionDto,
  ReorderActionSectionsDto,
  StudioPermission,
  UpdateActionSectionDto,
} from '@ahmedrioueche/actocore-shared';
import { RequireStudioPermission } from '../studio/decorators/require-studio-permission.decorator';
import { StudioCtx } from '../studio/decorators/studio-context.decorator';
import { StudioAuthGuard } from '../studio/guards/studio-auth.guard';
import { StudioPermissionsGuard } from '../studio/guards/studio-permissions.guard';
import type { StudioRequestContext } from '../studio/studio-context';
import { StudioAccessService } from '../studio/studio-access.service';
import { assertStudioProjectRoute } from '../studio/studio-project-route.util';
import { ProjectsService } from '../projects/projects.service';
import { ActionSectionsService } from './action-sections.service';

@UseGuards(StudioAuthGuard, StudioPermissionsGuard)
@Controller('web/projects/:projectId/action-sections')
export class ActionSectionsController {
  constructor(
    private readonly sections: ActionSectionsService,
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
    return apiSuccess(await this.sections.list(projectId));
  }

  @Post()
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async create(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Body() body: CreateActionSectionDto,
  ) {
    await this.assertRoute(ctx, projectId);
    return apiSuccess(await this.sections.create(projectId, body));
  }

  @Patch('reorder')
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async reorder(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Body() body: ReorderActionSectionsDto,
  ) {
    await this.assertRoute(ctx, projectId);
    return apiSuccess(await this.sections.reorder(projectId, body.sectionIds));
  }

  @Patch(':sectionId')
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async update(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
    @Body() body: UpdateActionSectionDto,
  ) {
    await this.assertRoute(ctx, projectId);
    return apiSuccess(await this.sections.update(projectId, sectionId, body));
  }

  @Delete(':sectionId')
  @RequireStudioPermission(StudioPermission.ACTIONS_WRITE)
  async remove(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
  ) {
    await this.assertRoute(ctx, projectId);
    return apiSuccess(await this.sections.remove(projectId, sectionId));
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
