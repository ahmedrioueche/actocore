import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  apiSuccess,
  StudioPermission,
  UpdateStudioOnboardingDto,
} from '@ahmedrioueche/actocore-shared';
import { RequireStudioPermission } from './decorators/require-studio-permission.decorator';
import { StudioCtx } from './decorators/studio-context.decorator';
import { StudioAuthGuard } from './guards/studio-auth.guard';
import { StudioPermissionsGuard } from './guards/studio-permissions.guard';
import type { StudioRequestContext } from './studio-context';
import { StudioOnboardingService } from './studio-onboarding.service';

@Controller('web/onboarding')
@UseGuards(StudioAuthGuard, StudioPermissionsGuard)
export class StudioOnboardingController {
  constructor(private readonly onboarding: StudioOnboardingService) {}

  @Get()
  @RequireStudioPermission(StudioPermission.PROJECT_READ)
  async getState(@StudioCtx() ctx: StudioRequestContext) {
    return apiSuccess(await this.onboarding.getState(ctx));
  }

  @Patch()
  @RequireStudioPermission(StudioPermission.PROJECT_WRITE)
  async updateState(
    @StudioCtx() ctx: StudioRequestContext,
    @Body() body: UpdateStudioOnboardingDto,
  ) {
    return apiSuccess(await this.onboarding.updateState(ctx, body));
  }
}
