import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import {
  apiSuccess,
  PlatformPermission,
  UsageEventsQueryDto,
  UsageExportQueryDto,
  UsageRangeQueryDto,
  UsageSeriesQueryDto,
} from '@ahmedrioueche/actocore-shared';
import { RequirePlatformPermission } from '../studio/decorators/require-platform-permission.decorator';
import { StudioAuthGuard } from '../studio/guards/studio-auth.guard';
import { StudioPermissionsGuard } from '../studio/guards/studio-permissions.guard';
import { PlatformPermissionGuard } from '../studio/guards/platform-permission.guard';
import { UsageService } from './usage.service';

/** Platform operator analytics — not exposed to tenant user admins. */
@UseGuards(StudioAuthGuard, StudioPermissionsGuard, PlatformPermissionGuard)
@RequirePlatformPermission(PlatformPermission.ANALYTICS_READ)
@Controller('web/admin/usage')
export class UsageAdminController {
  constructor(private readonly usage: UsageService) {}

  @Get('overview')
  async overview(@Query() query: UsageRangeQueryDto) {
    return apiSuccess(
      await this.usage.getPlatformUsageOverview(query.from, query.to),
    );
  }

  @Get('accounts/:accountId')
  async accountSummary(
    @Param('accountId') accountId: string,
    @Query() query: UsageRangeQueryDto,
  ) {
    return apiSuccess(
      await this.usage.getAccountSummaryForPlatform(accountId, query.from, query.to),
    );
  }

  @Get('projects/:projectId/breakdown')
  async projectBreakdown(
    @Param('projectId') projectId: string,
    @Query() query: UsageRangeQueryDto,
  ) {
    return apiSuccess(
      await this.usage.getProjectBreakdown(projectId, query.from, query.to),
    );
  }

  @Get('projects/:projectId')
  async projectSummary(
    @Param('projectId') projectId: string,
    @Query() query: UsageRangeQueryDto,
  ) {
    return apiSuccess(
      await this.usage.getProjectSummary(projectId, query.from, query.to),
    );
  }

  @Get('projects/:projectId/series')
  async series(
    @Param('projectId') projectId: string,
    @Query() query: UsageSeriesQueryDto,
  ) {
    return apiSuccess(
      await this.usage.getProjectTimeSeries(projectId, query.from, query.to),
    );
  }

  @Get('projects/:projectId/events')
  async events(
    @Param('projectId') projectId: string,
    @Query() query: UsageEventsQueryDto,
  ) {
    return apiSuccess(
      await this.usage.listProjectEvents(projectId, {
        from: query.from,
        to: query.to,
        page: query.page,
        limit: query.limit,
        redactApiKeys: false,
      }),
    );
  }

  @Get('projects/:projectId/knowledge')
  async knowledge(
    @Param('projectId') projectId: string,
    @Query() query: UsageRangeQueryDto,
  ) {
    return apiSuccess(
      await this.usage.getKnowledgeMetrics(projectId, query.from, query.to),
    );
  }

  @Get('projects/:projectId/sessions')
  async sessions(
    @Param('projectId') projectId: string,
    @Query() query: UsageRangeQueryDto,
  ) {
    return apiSuccess(
      await this.usage.getSessionMetrics(projectId, query.from, query.to),
    );
  }

  @Get('projects/:projectId/export')
  async exportUsage(
    @Param('projectId') projectId: string,
    @Query() query: UsageExportQueryDto,
    @Res() res: Response,
  ) {
    const file = await this.usage.exportProjectUsage(
      projectId,
      query.format ?? 'csv',
      query.from,
      query.to,
      false,
    );
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.body);
  }
}
