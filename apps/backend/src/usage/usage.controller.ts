import { Controller, Get, Param } from '@nestjs/common';
import { apiSuccess } from '@ahmedrioueche/actocore-shared';
import { Public } from '../auth/decorators/public.decorator';
import { UsageService } from './usage.service';

@Public()
@Controller('web/projects/:projectId/usage')
export class UsageController {
  constructor(private readonly usage: UsageService) {}

  @Get()
  async summary(@Param('projectId') projectId: string) {
    return apiSuccess(await this.usage.getProjectSummary(projectId));
  }
}
