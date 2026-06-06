import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  apiSuccess,
  StudioRole,
} from '@ahmedrioueche/actocore-shared';
import { RequireStudioRole } from './decorators/require-studio-role.decorator';
import { StudioAuthGuard } from './guards/studio-auth.guard';
import { StudioPermissionsGuard } from './guards/studio-permissions.guard';
import { StudioRoleGuard } from './guards/studio-role.guard';
import { StudioPlatformService } from './studio-platform.service';

@UseGuards(StudioAuthGuard, StudioPermissionsGuard, StudioRoleGuard)
@RequireStudioRole(StudioRole.SUPER_ADMIN)
@Controller('web/platform')
export class StudioPlatformController {
  constructor(private readonly platform: StudioPlatformService) {}

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

  @Get('accounts/:accountId')
  async getAccount(@Param('accountId') accountId: string) {
    return apiSuccess(await this.platform.getAccount(accountId));
  }
}
