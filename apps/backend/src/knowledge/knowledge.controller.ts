import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import {
  apiSuccess,
  CreateKnowledgeSourceDto,
} from '@ahmedrioueche/actocore-shared';
import { Public } from '../auth/decorators/public.decorator';
import { KnowledgeService } from './knowledge.service';

/** Studio control plane — project knowledge base for Q&A / RAG. */
@Public()
@Controller('web/projects/:projectId/knowledge')
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() body: CreateKnowledgeSourceDto,
  ) {
    return apiSuccess(await this.knowledge.create(projectId, body));
  }

  @Get()
  async list(@Param('projectId') projectId: string) {
    return apiSuccess(await this.knowledge.list(projectId));
  }

  @Get(':sourceId')
  async get(
    @Param('projectId') projectId: string,
    @Param('sourceId') sourceId: string,
  ) {
    return apiSuccess(await this.knowledge.findById(projectId, sourceId));
  }

  @Delete(':sourceId')
  async remove(
    @Param('projectId') projectId: string,
    @Param('sourceId') sourceId: string,
  ) {
    return apiSuccess(await this.knowledge.remove(projectId, sourceId));
  }
}
