import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import {
  apiSuccess,
  CreateProjectDto,
  StudioPermission,
  UpdateProjectDto,
  UpdateProjectSettingsDto,
} from '@ahmedrioueche/actocore-shared';
import { RequireStudioPermission } from '../studio/decorators/require-studio-permission.decorator';
import { StudioCtx } from '../studio/decorators/studio-context.decorator';
import { StudioAuthGuard } from '../studio/guards/studio-auth.guard';
import { StudioPermissionsGuard } from '../studio/guards/studio-permissions.guard';
import type { StudioRequestContext } from '../studio/studio-context';
import { StudioAccessService } from '../studio/studio-access.service';
import { ApiKeysService } from '../auth/api-keys.service';
import { QuotaService } from '../billing/quota.service';
import { SessionsService } from '../sessions/sessions.service';
import { ProjectsService } from './projects.service';

@UseGuards(StudioAuthGuard, StudioPermissionsGuard)
@Controller('web/projects')
export class ProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly studioAccess: StudioAccessService,
    private readonly apiKeys: ApiKeysService,
    @Inject(forwardRef(() => QuotaService))
    private readonly quota: QuotaService,
    private readonly sessions: SessionsService,
  ) {}

  @Get()
  @RequireStudioPermission(StudioPermission.PROJECT_READ)
  async list(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('archived') archived?: string,
    @Query('search') search?: string,
  ) {
    const archivedFilter =
      archived === 'true' ? true : archived === 'false' ? false : undefined;
    return apiSuccess(
      await this.projects.listPaginated(ctx, {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        archived: archivedFilter,
        search: search?.trim() || undefined,
      }),
    );
  }

  @Post()
  @RequireStudioPermission(StudioPermission.PROJECT_WRITE)
  async create(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Body() body: CreateProjectDto,
  ) {
    return apiSuccess(await this.projects.create(ctx, body));
  }

  @Post(':projectId/api-keys/rotate-all')
  @HttpCode(200)
  @RequireStudioPermission(StudioPermission.API_KEYS_WRITE)
  async rotateAllApiKeys(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
  ) {
    if (ctx) {
      this.studioAccess.assertProjectAccess(ctx, projectId);
    }
    return apiSuccess(await this.apiKeys.rotateAllForProject(ctx, projectId));
  }

  @Get(':projectId/usage/quota')
  @RequireStudioPermission(StudioPermission.BILLING_READ)
  async projectQuota(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
  ) {
    if (ctx) {
      this.studioAccess.assertProjectAccess(ctx, projectId);
    }
    return apiSuccess(await this.quota.getProjectQuotaStatus(projectId));
  }

  @Get(':projectId/sessions')
  @RequireStudioPermission(StudioPermission.PROJECT_READ)
  async listSessions(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('externalUserId') externalUserId?: string,
  ) {
    if (ctx) {
      this.studioAccess.assertProjectAccess(ctx, projectId);
      await this.projects.assertExistsForAccount(ctx, projectId);
    } else {
      await this.projects.assertExists(projectId);
    }
    return apiSuccess(
      await this.sessions.listForProjectPaginated(projectId, {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        externalUserId: externalUserId?.trim() || undefined,
      }),
    );
  }

  @Get(':projectId/sessions/:sessionId/messages')
  @RequireStudioPermission(StudioPermission.PROJECT_READ)
  async listSessionMessages(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Param('sessionId') sessionId: string,
  ) {
    if (ctx) {
      this.studioAccess.assertProjectAccess(ctx, projectId);
    }
    return apiSuccess(
      await this.sessions.listMessages(projectId, sessionId),
    );
  }

  @Get(':projectId/api-keys')
  @RequireStudioPermission(StudioPermission.API_KEYS_READ)
  async listApiKeys(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('includeRevoked') includeRevoked?: string,
  ) {
    if (ctx) {
      this.studioAccess.assertProjectAccess(ctx, projectId);
    }
    return apiSuccess(
      await this.apiKeys.listForProjectPaginated(ctx, projectId, {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        includeRevoked: includeRevoked === 'true',
      }),
    );
  }

  @Get(':projectId')
  @RequireStudioPermission(StudioPermission.PROJECT_READ)
  async get(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
  ) {
    if (ctx) {
      this.studioAccess.assertProjectAccess(ctx, projectId);
    }
    return apiSuccess(await this.projects.findByIdOrFail(ctx, projectId));
  }

  @Patch(':projectId')
  @RequireStudioPermission(StudioPermission.PROJECT_WRITE)
  async update(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Body() body: UpdateProjectDto,
  ) {
    if (ctx) {
      this.studioAccess.assertProjectAccess(ctx, projectId);
    }
    return apiSuccess(await this.projects.update(ctx, projectId, body));
  }

  @Delete(':projectId')
  @HttpCode(200)
  @RequireStudioPermission(StudioPermission.PROJECT_WRITE)
  async remove(
    @StudioCtx() ctx: StudioRequestContext,
    @Param('projectId') projectId: string,
  ) {
    this.studioAccess.assertProjectAccess(ctx, projectId);
    return apiSuccess(await this.projects.delete(ctx, projectId));
  }

  @Patch(':projectId/settings')
  @RequireStudioPermission(StudioPermission.PROJECT_WRITE)
  async updateSettings(
    @StudioCtx('optional') ctx: StudioRequestContext | null,
    @Param('projectId') projectId: string,
    @Body() body: UpdateProjectSettingsDto,
  ) {
    if (ctx) {
      this.studioAccess.assertProjectAccess(ctx, projectId);
    }
    return apiSuccess(
      await this.projects.updateSettings(ctx, projectId, body),
    );
  }
}
