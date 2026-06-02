import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  apiSuccess,
  CreateActionDto,
  UpdateActionDto,
} from '@ahmedrioueche/actocore-shared';
import { Public } from '../auth/decorators/public.decorator';
import { ActionsService } from './actions.service';

/** Studio control plane — register tools/actions per project. */
@Public()
@Controller('web/projects/:projectId/actions')
export class ActionsController {
  constructor(private readonly actions: ActionsService) {}

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() body: CreateActionDto,
  ) {
    return apiSuccess(await this.actions.create(projectId, body));
  }

  @Get()
  async list(@Param('projectId') projectId: string) {
    return apiSuccess(await this.actions.list(projectId));
  }

  @Get(':actionId')
  async get(
    @Param('projectId') projectId: string,
    @Param('actionId') actionId: string,
  ) {
    return apiSuccess(await this.actions.findById(projectId, actionId));
  }

  @Patch(':actionId')
  async update(
    @Param('projectId') projectId: string,
    @Param('actionId') actionId: string,
    @Body() body: UpdateActionDto,
  ) {
    return apiSuccess(await this.actions.update(projectId, actionId, body));
  }

  @Delete(':actionId')
  async remove(
    @Param('projectId') projectId: string,
    @Param('actionId') actionId: string,
  ) {
    return apiSuccess(await this.actions.remove(projectId, actionId));
  }
}
