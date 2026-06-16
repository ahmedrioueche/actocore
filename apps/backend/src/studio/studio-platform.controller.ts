import { Controller, Get, Param, Query, UseGuards, Body, Patch } from '@nestjs/common';
import {
  apiSuccess,
  PlatformPermission,
  UpdateStudioReportStatusDto,
} from '@ahmedrioueche/actocore-shared';
import { RequirePlatformPermission } from './decorators/require-platform-permission.decorator';
import { StudioAuthGuard } from './guards/studio-auth.guard';
import { StudioPermissionsGuard } from './guards/studio-permissions.guard';
import { PlatformPermissionGuard } from './guards/platform-permission.guard';
import { StudioPlatformService } from './studio-platform.service';
import { StudioReportsService } from './studio-reports.service';

@UseGuards(StudioAuthGuard, StudioPermissionsGuard, PlatformPermissionGuard)
@Controller('web/platform')
export class StudioPlatformController {
  constructor(
    private readonly platform: StudioPlatformService,
    private readonly reports: StudioReportsService,
  ) {}

  @RequirePlatformPermission(PlatformPermission.ACCOUNTS_READ)
  @Get('accounts')
  async listAccounts(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return apiSuccess(
      await this.platform.listAccountsPaginated({
        search: search?.trim() || undefined,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      }),
    );
  }

  @RequirePlatformPermission(PlatformPermission.ACCOUNTS_READ)
  @Get('accounts/:accountId')
  async getAccount(@Param('accountId') accountId: string) {
    return apiSuccess(await this.platform.getAccount(accountId));
  }

  @RequirePlatformPermission(PlatformPermission.SUBSCRIPTIONS_READ)
  @Get('subscriptions')
  async listSubscriptions(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return apiSuccess(
      await this.platform.listSubscriptionsPaginated({
        search: search?.trim() || undefined,
        status: status?.trim() || undefined,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      }),
    );
  }

  @RequirePlatformPermission(PlatformPermission.SUBSCRIPTIONS_READ)
  @Get('accounts/:accountId/subscription')
  async getAccountSubscription(@Param('accountId') accountId: string) {
    return apiSuccess(await this.platform.getAccountSubscriptionDetail(accountId));
  }

  @RequirePlatformPermission(PlatformPermission.USERS_READ)
  @Get('users')
  async listUsers(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return apiSuccess(
      await this.platform.listUsersPaginated({
        search: search?.trim() || undefined,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      }),
    );
  }

  @RequirePlatformPermission(PlatformPermission.PROJECTS_READ)
  @Get('projects')
  async listProjects(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return apiSuccess(
      await this.platform.listProjectsPaginated({
        search: search?.trim() || undefined,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      }),
    );
  }

  @RequirePlatformPermission(PlatformPermission.ANALYTICS_READ)
  @Get('analytics/overview')
  async analyticsOverview() {
    return apiSuccess(await this.platform.getAnalyticsOverview());
  }

  @RequirePlatformPermission(PlatformPermission.REPORTS_READ)
  @Get('reports')
  async listReports(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return apiSuccess(
      await this.reports.listAll(
        {
          search: search?.trim() || undefined,
          status: status?.trim() || undefined,
          type: type?.trim() || undefined,
        },
        {
          page: page ? parseInt(page, 10) : undefined,
          limit: limit ? parseInt(limit, 10) : undefined,
        },
      ),
    );
  }

  @RequirePlatformPermission(PlatformPermission.REPORTS_READ)
  @Get('reports/:reportId')
  async getReport(@Param('reportId') reportId: string) {
    return apiSuccess(await this.reports.getById(reportId));
  }

  @RequirePlatformPermission(PlatformPermission.REPORTS_WRITE)
  @Patch('reports/:reportId')
  async updateReport(
    @Param('reportId') reportId: string,
    @Body() body: UpdateStudioReportStatusDto,
  ) {
    return apiSuccess(await this.reports.updateStatus(reportId, body));
  }
}
