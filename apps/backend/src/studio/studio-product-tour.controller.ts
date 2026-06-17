import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  apiSuccess,
  StudioPermission,
  UpdateStudioProductTourDto,
} from '@ahmedrioueche/actocore-shared';
import { RequireStudioPermission } from './decorators/require-studio-permission.decorator';
import { StudioCtx } from './decorators/studio-context.decorator';
import { StudioAuthGuard } from './guards/studio-auth.guard';
import { StudioPermissionsGuard } from './guards/studio-permissions.guard';
import type { StudioRequestContext } from './studio-context';
import { StudioProductTourService } from './studio-product-tour.service';

@Controller('web/product-tour')
@UseGuards(StudioAuthGuard, StudioPermissionsGuard)
export class StudioProductTourController {
  constructor(private readonly productTour: StudioProductTourService) {}

  @Get()
  @RequireStudioPermission(StudioPermission.PROJECT_READ)
  async getState(@StudioCtx() ctx: StudioRequestContext) {
    return apiSuccess(await this.productTour.getState(ctx));
  }

  @Patch()
  @RequireStudioPermission(StudioPermission.PROJECT_READ)
  async updateState(
    @StudioCtx() ctx: StudioRequestContext,
    @Body() body: UpdateStudioProductTourDto,
  ) {
    return apiSuccess(await this.productTour.updateState(ctx, body));
  }
}
