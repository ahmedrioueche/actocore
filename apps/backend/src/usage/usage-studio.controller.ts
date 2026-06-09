import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  apiSuccess,
  StudioPermission,
  UsageEventsQueryDto,
  UsageRangeQueryDto,
  UsageSeriesQueryDto,
} from '@ahmedrioueche/actocore-shared';
import { RequireStudioPermission } from '../studio/decorators/require-studio-permission.decorator';
import { StudioCtx } from '../studio/decorators/studio-context.decorator';
import { StudioAuthGuard } from '../studio/guards/studio-auth.guard';
import { StudioPermissionsGuard } from '../studio/guards/studio-permissions.guard';
import type { StudioRequestContext } from '../studio/studio-context';
import { StudioAccessService } from '../studio/studio-access.service';
import { ProjectsService } from '../projects/projects.service';
import { UsageService } from './usage.service';

@UseGuards(StudioAuthGuard, StudioPermissionsGuard)
@Controller('web/usage')
export class UsageStudioController {
  constructor(private readonly usage: UsageService) {}

  @Get()
  @RequireStudioPermission(StudioPermission.USAGE_READ)
  async accountSummary(
    @StudioCtx() ctx: StudioRequestContext,
    @Query() query: UsageRangeQueryDto,
  ) {
    return apiSuccess(
      await this.usage.getAccountSummary(ctx, query.from, query.to),
    );
  }
}

@UseGuards(StudioAuthGuard, StudioPermissionsGuard)
@Controller('web/projects/:projectId/usage')
export class ProjectUsageStudioController {
  constructor(
    private readonly usage: UsageService,
    private readonly studioAccess: StudioAccessService,
    private readonly projects: ProjectsService,
  ) {}

  private async assertTenantProject(
    ctx: StudioRequestContext,
    projectId: string,
  ): Promise<void> {
    this.studioAccess.assertProjectAccess(ctx, projectId);
    await this.projects.assertExistsForAccount(ctx, projectId);
  }

  @Get('summary')
  @RequireStudioPermission(StudioPermission.USAGE_READ)
  async summary(
    @StudioCtx() ctx: StudioRequestContext,
    @Param('projectId') projectId: string,
    @Query() query: UsageRangeQueryDto,
  ) {
    await this.assertTenantProject(ctx, projectId);
    return apiSuccess(
      await this.usage.getProjectSummary(projectId, query.from, query.to, {
        labelApiKeys: true,
      }),
    );
  }

  @Get('series')
  @RequireStudioPermission(StudioPermission.USAGE_READ)
  async series(
    @StudioCtx() ctx: StudioRequestContext,
    @Param('projectId') projectId: string,
    @Query() query: UsageSeriesQueryDto,
  ) {
    await this.assertTenantProject(ctx, projectId);
    return apiSuccess(
      await this.usage.getProjectTimeSeries(projectId, query.from, query.to),
    );
  }

  @Get('breakdown')
  @RequireStudioPermission(StudioPermission.USAGE_READ)
  async breakdown(
    @StudioCtx() ctx: StudioRequestContext,
    @Param('projectId') projectId: string,
    @Query() query: UsageRangeQueryDto,
  ) {
    await this.assertTenantProject(ctx, projectId);
    return apiSuccess(
      await this.usage.getProjectBreakdown(projectId, query.from, query.to),
    );
  }

  @Get('events')
  @RequireStudioPermission(StudioPermission.USAGE_READ)
  async events(
    @StudioCtx() ctx: StudioRequestContext,
    @Param('projectId') projectId: string,
    @Query() query: UsageEventsQueryDto,
  ) {
    await this.assertTenantProject(ctx, projectId);
    return apiSuccess(
      await this.usage.listProjectEvents(projectId, {
        from: query.from,
        to: query.to,
        page: query.page,
        limit: query.limit,
        redactApiKeys: true,
      }),
    );
  }
}
