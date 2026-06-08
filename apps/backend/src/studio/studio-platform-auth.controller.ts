import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import {
  apiSuccess,
  PlatformChangePasswordDto,
  PlatformLoginDto,
  PlatformPermission,
  PlatformRefreshDto,
  UpdateStudioProfileDto,
} from '@ahmedrioueche/actocore-shared';
import { StudioPublic } from './decorators/studio-public.decorator';
import { RequirePlatformPermission } from './decorators/require-platform-permission.decorator';
import { StudioCtx } from './decorators/studio-context.decorator';
import { StudioAuthGuard } from './guards/studio-auth.guard';
import { StudioPermissionsGuard } from './guards/studio-permissions.guard';
import { PlatformPermissionGuard } from './guards/platform-permission.guard';
import { StudioPlatformAuthService } from './studio-platform-auth.service';
import type { StudioRequestContext } from './studio-context';

@Controller('web/platform/auth')
export class StudioPlatformAuthController {
  constructor(private readonly auth: StudioPlatformAuthService) {}

  @StudioPublic()
  @Post('login')
  async login(@Body() body: PlatformLoginDto) {
    return apiSuccess(await this.auth.login(body));
  }

  @StudioPublic()
  @Post('refresh')
  async refresh(@Body() body: PlatformRefreshDto) {
    return apiSuccess(await this.auth.refresh(body.refreshToken));
  }

  @UseGuards(StudioAuthGuard, StudioPermissionsGuard, PlatformPermissionGuard)
  @Get('me')
  async me(@StudioCtx() ctx: StudioRequestContext) {
    return apiSuccess(await this.auth.getMe(ctx));
  }

  @UseGuards(StudioAuthGuard, StudioPermissionsGuard, PlatformPermissionGuard)
  @RequirePlatformPermission(PlatformPermission.SETTINGS_WRITE)
  @Patch('me')
  async updateProfile(
    @StudioCtx() ctx: StudioRequestContext,
    @Body() body: UpdateStudioProfileDto,
  ) {
    return apiSuccess(await this.auth.updateProfile(ctx, body));
  }

  @UseGuards(StudioAuthGuard, StudioPermissionsGuard, PlatformPermissionGuard)
  @RequirePlatformPermission(PlatformPermission.SETTINGS_WRITE)
  @Post('change-password')
  async changePassword(
    @StudioCtx() ctx: StudioRequestContext,
    @Body() body: PlatformChangePasswordDto,
  ) {
    return apiSuccess(await this.auth.changePassword(ctx, body));
  }
}
