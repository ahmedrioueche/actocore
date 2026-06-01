import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { apiSuccess, CreateSessionDto } from '@ahmedrioueche/actocore-shared';
import type { RequestContextData } from '@ahmedrioueche/actocore-shared';
import { ApiKeyGuard } from '../../auth/guards/api-key.guard';
import { ProjectId } from '../../auth/decorators/project-id.decorator';
import { RequestContext } from '../../request-context/decorators/request-context.decorator';
import { SdkSessionStore } from './sdk-session.store';

@UseGuards(ApiKeyGuard)
@Controller('sdk/sessions')
export class SdkSessionsController {
  constructor(private readonly sessions: SdkSessionStore) {}

  @Post()
  create(
    @RequestContext() context: RequestContextData,
    @Body() body: CreateSessionDto,
  ) {
    return apiSuccess(this.sessions.create(context.projectId, body));
  }

  @Get(':sessionId/messages')
  listMessages(
    @ProjectId() projectId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return apiSuccess(this.sessions.listMessages(projectId, sessionId));
  }

  @Get(':sessionId')
  get(@ProjectId() projectId: string, @Param('sessionId') sessionId: string) {
    return apiSuccess(this.sessions.get(projectId, sessionId));
  }
}
