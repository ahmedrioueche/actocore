import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  apiSuccess,
  StudioPermission,
  UpdateStudioAccountDto,
  UpdateStudioAccountPreferencesDto,
} from '@ahmedrioueche/actocore-shared';
import { RequireStudioPermission } from './decorators/require-studio-permission.decorator';
import { StudioCtx } from './decorators/studio-context.decorator';
import { StudioAuthGuard } from './guards/studio-auth.guard';
import { StudioPermissionsGuard } from './guards/studio-permissions.guard';
import type { StudioRequestContext } from './studio-context';
import { StudioAccountService } from './studio-account.service';

@Controller('web/account')
@UseGuards(StudioAuthGuard, StudioPermissionsGuard)
export class StudioAccountController {
  constructor(private readonly accounts: StudioAccountService) {}

  @Get()
  @RequireStudioPermission(StudioPermission.PROJECT_READ)
  async getAccount(@StudioCtx() ctx: StudioRequestContext) {
    return apiSuccess(await this.accounts.getSettings(ctx));
  }

  @Patch()
  @RequireStudioPermission(StudioPermission.PROJECT_WRITE)
  async updateAccount(
    @StudioCtx() ctx: StudioRequestContext,
    @Body() body: UpdateStudioAccountDto,
  ) {
    return apiSuccess(await this.accounts.updateSettings(ctx, body));
  }

  @Get('preferences')
  @RequireStudioPermission(StudioPermission.PROJECT_READ)
  async getPreferences(@StudioCtx() ctx: StudioRequestContext) {
    return apiSuccess(await this.accounts.getPreferences(ctx));
  }

  @Patch('preferences')
  @RequireStudioPermission(StudioPermission.PROJECT_WRITE)
  async updatePreferences(
    @StudioCtx() ctx: StudioRequestContext,
    @Body() body: UpdateStudioAccountPreferencesDto,
  ) {
    return apiSuccess(await this.accounts.updatePreferences(ctx, body));
  }
}
