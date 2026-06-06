import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  apiSuccess,
  CreateStudioPlanDto,
  StudioRole,
  UpdateStudioPlanDto,
} from '@ahmedrioueche/actocore-shared';
import { RequireStudioRole } from '../studio/decorators/require-studio-role.decorator';
import { StudioAuthGuard } from '../studio/guards/studio-auth.guard';
import { StudioPermissionsGuard } from '../studio/guards/studio-permissions.guard';
import { StudioRoleGuard } from '../studio/guards/studio-role.guard';
import { StudioPlansService } from './studio-plans.service';

@Controller('web/admin/plans')
@UseGuards(StudioAuthGuard, StudioPermissionsGuard, StudioRoleGuard)
@RequireStudioRole(StudioRole.SUPER_ADMIN)
export class StudioPlansAdminController {
  constructor(private readonly plans: StudioPlansService) {}

  @Get()
  async list(
    @Query('includeInactive') includeInactive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return apiSuccess(
      await this.plans.listPaginated(includeInactive === 'true', {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      }),
    );
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return apiSuccess(await this.plans.getByMongoId(id));
  }

  @Post()
  async create(@Body() body: CreateStudioPlanDto) {
    return apiSuccess(await this.plans.create(body));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateStudioPlanDto) {
    return apiSuccess(await this.plans.update(id, body));
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return apiSuccess(await this.plans.remove(id));
  }
}
