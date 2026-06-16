import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  apiSuccess,
  CreateStudioReportDto,
} from '@ahmedrioueche/actocore-shared';
import { StudioCtx } from './decorators/studio-context.decorator';
import { StudioAuthGuard } from './guards/studio-auth.guard';
import { StudioPermissionsGuard } from './guards/studio-permissions.guard';
import type { StudioRequestContext } from './studio-context';
import { StudioReportsService } from './studio-reports.service';

@Controller('web/reports')
@UseGuards(StudioAuthGuard, StudioPermissionsGuard)
export class StudioReportsController {
  constructor(private readonly reports: StudioReportsService) {}

  @Post()
  async create(
    @StudioCtx() ctx: StudioRequestContext,
    @Body() body: CreateStudioReportDto,
  ) {
    return apiSuccess(await this.reports.create(ctx, body));
  }

  @Get()
  async list(
    @StudioCtx() ctx: StudioRequestContext,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return apiSuccess(
      await this.reports.listForAccount(ctx.accountId, {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      }),
    );
  }

  @Get(':reportId')
  async getOne(
    @StudioCtx() ctx: StudioRequestContext,
    @Param('reportId') reportId: string,
  ) {
    return apiSuccess(
      await this.reports.getForAccount(ctx.accountId, reportId),
    );
  }
}
