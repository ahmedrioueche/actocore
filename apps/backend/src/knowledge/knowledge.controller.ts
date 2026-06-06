import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  apiSuccess,
  CreateKnowledgeSourceDto,
  StudioPermission,
} from '@ahmedrioueche/actocore-shared';
import {
  KNOWLEDGE_UPLOAD_FIELD_NAME,
  KNOWLEDGE_UPLOAD_MAX_BYTES,
} from '@ahmedrioueche/actocore-shared/constants/knowledge-upload';
import { RequireStudioPermission } from '../studio/decorators/require-studio-permission.decorator';
import { StudioCtx } from '../studio/decorators/studio-context.decorator';
import { StudioAuthGuard } from '../studio/guards/studio-auth.guard';
import { StudioPermissionsGuard } from '../studio/guards/studio-permissions.guard';
import type { StudioRequestContext } from '../studio/studio-context';
import { StudioAccessService } from '../studio/studio-access.service';
import { assertStudioProjectRoute } from '../studio/studio-project-route.util';
import { ProjectsService } from '../projects/projects.service';
import { KnowledgeService } from './knowledge.service';

@UseGuards(StudioAuthGuard, StudioPermissionsGuard)
@Controller('web/projects/:projectId/knowledge')
export class KnowledgeController {
  constructor(
    private readonly knowledge: KnowledgeService,
    private readonly projects: ProjectsService,
    private readonly studioAccess: StudioAccessService,
  ) {}

  @Post('upload')
  @RequireStudioPermission(StudioPermission.KNOWLEDGE_WRITE)
  @UseInterceptors(
    FileInterceptor(KNOWLEDGE_UPLOAD_FIELD_NAME, {
      storage: memoryStorage(),
      limits: { fileSize: KNOWLEDGE_UPLOAD_MAX_BYTES },
    }),
  )
  async upload(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('title') title?: string,
  ) {
    await assertStudioProjectRoute(
      ctx,
      projectId,
      this.studioAccess,
      this.projects,
    );
    return apiSuccess(await this.knowledge.uploadFile(projectId, file, title));
  }

  @Post()
  @RequireStudioPermission(StudioPermission.KNOWLEDGE_WRITE)
  async create(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Body() body: CreateKnowledgeSourceDto,
  ) {
    await assertStudioProjectRoute(
      ctx,
      projectId,
      this.studioAccess,
      this.projects,
    );
    return apiSuccess(await this.knowledge.create(projectId, body));
  }

  @Get()
  @RequireStudioPermission(StudioPermission.KNOWLEDGE_READ)
  async list(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    await assertStudioProjectRoute(
      ctx,
      projectId,
      this.studioAccess,
      this.projects,
    );
    return apiSuccess(
      await this.knowledge.listPaginated(projectId, {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      }),
    );
  }

  @Get(':sourceId')
  @RequireStudioPermission(StudioPermission.KNOWLEDGE_READ)
  async get(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Param('sourceId') sourceId: string,
  ) {
    await assertStudioProjectRoute(
      ctx,
      projectId,
      this.studioAccess,
      this.projects,
    );
    return apiSuccess(await this.knowledge.findById(projectId, sourceId));
  }

  @Delete(':sourceId')
  @RequireStudioPermission(StudioPermission.KNOWLEDGE_DELETE)
  async remove(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Param('sourceId') sourceId: string,
  ) {
    await assertStudioProjectRoute(
      ctx,
      projectId,
      this.studioAccess,
      this.projects,
    );
    return apiSuccess(await this.knowledge.remove(projectId, sourceId));
  }
}
