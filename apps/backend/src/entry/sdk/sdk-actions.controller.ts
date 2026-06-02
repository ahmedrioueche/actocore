import { Controller, Get, UseGuards } from '@nestjs/common';
import { apiSuccess } from '@ahmedrioueche/actocore-shared';
import { ApiKeyGuard } from '../../auth/guards/api-key.guard';
import { ProjectId } from '../../auth/decorators/project-id.decorator';
import { ActionsService } from '../../actions/actions.service';

@UseGuards(ApiKeyGuard)
@Controller('sdk/actions')
export class SdkActionsController {
  constructor(private readonly actions: ActionsService) {}

  @Get()
  async list(@ProjectId() projectId: string) {
    return apiSuccess(await this.actions.listEnabled(projectId));
  }
}
