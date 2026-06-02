import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { apiSuccess, CreateSessionDto } from '@ahmedrioueche/actocore-shared';
import type { RequestContextData } from '@ahmedrioueche/actocore-shared';
import { ApiKeyGuard } from '../../auth/guards/api-key.guard';
import { ProjectId } from '../../auth/decorators/project-id.decorator';
import { RequestContext } from '../../request-context/decorators/request-context.decorator';
import { SessionsService } from '../../sessions/sessions.service';

@UseGuards(ApiKeyGuard)
@Controller('sdk/sessions')
export class SdkSessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Post()
  async create(
    @RequestContext() context: RequestContextData,
    @Body() body: CreateSessionDto,
  ) {
    return apiSuccess(
      await this.sessions.create(context.projectId, body),
    );
  }

  @Get(':sessionId/messages')
  async listMessages(
    @ProjectId() projectId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return apiSuccess(
      await this.sessions.listMessages(projectId, sessionId),
    );
  }

  @Get(':sessionId')
  async get(
    @ProjectId() projectId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return apiSuccess(await this.sessions.get(projectId, sessionId));
  }
}
