import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  apiSuccess,
  CreateProjectDto,
  UpdateProjectSettingsDto,
} from '@ahmedrioueche/actocore-shared';
import { Public } from '../auth/decorators/public.decorator';
import { ProjectsService } from './projects.service';

/** Studio control plane — dashboard auth will be added later. */
@Public()
@Controller('web/projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  async create(@Body() body: CreateProjectDto) {
    return apiSuccess(await this.projects.create(body));
  }

  @Get(':projectId')
  async get(@Param('projectId') projectId: string) {
    return apiSuccess(await this.projects.findByIdOrFail(projectId));
  }

  @Patch(':projectId/settings')
  async updateSettings(
    @Param('projectId') projectId: string,
    @Body() body: UpdateProjectSettingsDto,
  ) {
    return apiSuccess(await this.projects.updateSettings(projectId, body));
  }
}
