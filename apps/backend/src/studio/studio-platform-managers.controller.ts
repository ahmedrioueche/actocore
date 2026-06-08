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
  CreatePlatformManagerDto,
  PlatformPermission,
  UpdatePlatformManagerDto,
} from '@ahmedrioueche/actocore-shared';
import { RequirePlatformPermission } from './decorators/require-platform-permission.decorator';
import { StudioCtx } from './decorators/studio-context.decorator';
import { StudioAuthGuard } from './guards/studio-auth.guard';
import { StudioPermissionsGuard } from './guards/studio-permissions.guard';
import { PlatformPermissionGuard } from './guards/platform-permission.guard';
import { StudioPlatformManagersService } from './studio-platform-managers.service';
import type { StudioRequestContext } from './studio-context';

@UseGuards(StudioAuthGuard, StudioPermissionsGuard, PlatformPermissionGuard)
@RequirePlatformPermission(PlatformPermission.TEAM_WRITE)
@Controller('web/platform/managers')
export class StudioPlatformManagersController {
  constructor(private readonly managers: StudioPlatformManagersService) {}

  @Get()
  async list(@StudioCtx() ctx: StudioRequestContext) {
    return apiSuccess(await this.managers.list(ctx));
  }

  @Post()
  async create(
    @StudioCtx() ctx: StudioRequestContext,
    @Body() body: CreatePlatformManagerDto,
  ) {
    return apiSuccess(await this.managers.create(ctx, body));
  }

  @Patch(':userId')
  async update(
    @StudioCtx() ctx: StudioRequestContext,
    @Param('userId') userId: string,
    @Body() body: UpdatePlatformManagerDto,
  ) {
    return apiSuccess(await this.managers.update(ctx, userId, body));
  }

  @Delete(':userId')
  async remove(
    @StudioCtx() ctx: StudioRequestContext,
    @Param('userId') userId: string,
  ) {
    return apiSuccess(await this.managers.remove(ctx, userId));
  }
}
