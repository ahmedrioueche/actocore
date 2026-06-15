import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
  CreateActionDto,
  CreateAppPageDto,
  CreateKnowledgeSourceDto,
  UpdateActionDto,
  UpdateAppPageDto,
  UpdateSdkProjectConfigDto,
  type RuntimeConfigData,
} from '@ahmedrioueche/actocore-shared';
import {
  KNOWLEDGE_UPLOAD_FIELD_NAME,
  KNOWLEDGE_UPLOAD_MAX_BYTES,
} from '@ahmedrioueche/actocore-shared/constants/knowledge-upload';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../../auth/decorators/public.decorator';
import { PlaygroundCtx } from './playground-context.decorator';
import { PlaygroundGuard } from './playground.guard';
import { PlaygroundService } from './playground.service';
import { ActionsService } from '../../../actions/actions.service';
import { AppPagesService } from '../../../actions/app-pages.service';
import { KnowledgeService } from '../../../knowledge/knowledge.service';
import { SdkConfigService } from '../../../projects/sdk-config/sdk-config.service';
import type { VoiceResolvedConfig } from '../../../config/voice.config';

@Public()
@UseGuards(PlaygroundGuard)
@Controller('marketing/playground/projects/:projectId')
export class PlaygroundProjectsController {
  constructor(
    private readonly playground: PlaygroundService,
    private readonly actions: ActionsService,
    private readonly appPages: AppPagesService,
    private readonly knowledge: KnowledgeService,
    private readonly sdkConfig: SdkConfigService,
    private readonly config: ConfigService,
  ) {}

  @Get('runtime')
  async runtime(
    @Param('projectId') projectId: string,
    @PlaygroundCtx() token: { visitorId: string; projectId: string },
  ) {
    await this.playground.assertProjectAccess(projectId, token);
    const voice = this.config.get<VoiceResolvedConfig>('voice');
    const [sdk, pages] = await Promise.all([
      this.sdkConfig.getConfig(projectId),
      this.appPages.listManifest(projectId),
    ]);

    const payload: RuntimeConfigData = {
      apiVersion: this.config.getOrThrow<string>('apiVersion'),
      features: ['chat', 'sessions', 'sdk-config', 'app-pages'],
      projectId,
      voice: {
        serverTranscription: false,
        sttProvider: voice?.sttProvider ?? 'stub',
      },
      sdk,
      pages: pages.length > 0 ? pages : undefined,
    };

    return apiSuccess(payload);
  }

  @Get('actions')
  async listActions(
    @Param('projectId') projectId: string,
    @PlaygroundCtx() token: { visitorId: string; projectId: string },
  ) {
    await this.playground.assertProjectAccess(projectId, token);
    return apiSuccess(await this.actions.list(projectId));
  }

  @Post('actions')
  async createAction(
    @Param('projectId') projectId: string,
    @PlaygroundCtx() token: { visitorId: string; projectId: string },
    @Body() body: CreateActionDto,
  ) {
    await this.playground.assertProjectAccess(projectId, token);
    return apiSuccess(await this.actions.create(projectId, body));
  }

  @Patch('actions/:actionId')
  async updateAction(
    @Param('projectId') projectId: string,
    @Param('actionId') actionId: string,
    @PlaygroundCtx() token: { visitorId: string; projectId: string },
    @Body() body: UpdateActionDto,
  ) {
    await this.playground.assertProjectAccess(projectId, token);
    return apiSuccess(await this.actions.update(projectId, actionId, body));
  }

  @Delete('actions/:actionId')
  async deleteAction(
    @Param('projectId') projectId: string,
    @Param('actionId') actionId: string,
    @PlaygroundCtx() token: { visitorId: string; projectId: string },
  ) {
    await this.playground.assertProjectAccess(projectId, token);
    return apiSuccess(await this.actions.remove(projectId, actionId));
  }

  @Get('app-pages')
  async listAppPages(
    @Param('projectId') projectId: string,
    @PlaygroundCtx() token: { visitorId: string; projectId: string },
  ) {
    await this.playground.assertProjectAccess(projectId, token);
    return apiSuccess(await this.appPages.list(projectId));
  }

  @Post('app-pages')
  async createAppPage(
    @Param('projectId') projectId: string,
    @PlaygroundCtx() token: { visitorId: string; projectId: string },
    @Body() body: CreateAppPageDto,
  ) {
    await this.playground.assertProjectAccess(projectId, token);
    return apiSuccess(await this.appPages.create(projectId, body));
  }

  @Patch('app-pages/:pageId')
  async updateAppPage(
    @Param('projectId') projectId: string,
    @Param('pageId') pageId: string,
    @PlaygroundCtx() token: { visitorId: string; projectId: string },
    @Body() body: UpdateAppPageDto,
  ) {
    await this.playground.assertProjectAccess(projectId, token);
    return apiSuccess(await this.appPages.update(projectId, pageId, body));
  }

  @Delete('app-pages/:pageId')
  async deleteAppPage(
    @Param('projectId') projectId: string,
    @Param('pageId') pageId: string,
    @PlaygroundCtx() token: { visitorId: string; projectId: string },
  ) {
    await this.playground.assertProjectAccess(projectId, token);
    return apiSuccess(await this.appPages.remove(projectId, pageId));
  }

  @Get('knowledge')
  async listKnowledge(
    @Param('projectId') projectId: string,
    @PlaygroundCtx() token: { visitorId: string; projectId: string },
  ) {
    await this.playground.assertProjectAccess(projectId, token);
    return apiSuccess(await this.knowledge.list(projectId));
  }

  @Post('knowledge')
  async createKnowledge(
    @Param('projectId') projectId: string,
    @PlaygroundCtx() token: { visitorId: string; projectId: string },
    @Body() body: CreateKnowledgeSourceDto,
  ) {
    await this.playground.assertProjectAccess(projectId, token);
    return apiSuccess(await this.knowledge.create(projectId, body));
  }

  @Post('knowledge/upload')
  @UseInterceptors(
    FileInterceptor(KNOWLEDGE_UPLOAD_FIELD_NAME, {
      storage: memoryStorage(),
      limits: { fileSize: KNOWLEDGE_UPLOAD_MAX_BYTES },
    }),
  )
  async uploadKnowledge(
    @Param('projectId') projectId: string,
    @PlaygroundCtx() token: { visitorId: string; projectId: string },
    @UploadedFile() file: Express.Multer.File,
    @Query('title') title?: string,
  ) {
    await this.playground.assertProjectAccess(projectId, token);
    return apiSuccess(await this.knowledge.uploadFile(projectId, file, title));
  }

  @Delete('knowledge/:sourceId')
  async deleteKnowledge(
    @Param('projectId') projectId: string,
    @Param('sourceId') sourceId: string,
    @PlaygroundCtx() token: { visitorId: string; projectId: string },
  ) {
    await this.playground.assertProjectAccess(projectId, token);
    return apiSuccess(await this.knowledge.remove(projectId, sourceId));
  }

  @Get('sdk-config')
  async getSdkConfig(
    @Param('projectId') projectId: string,
    @PlaygroundCtx() token: { visitorId: string; projectId: string },
  ) {
    await this.playground.assertProjectAccess(projectId, token);
    return apiSuccess(await this.sdkConfig.getConfig(projectId));
  }

  @Patch('sdk-config')
  async updateSdkConfig(
    @Param('projectId') projectId: string,
    @PlaygroundCtx() token: { visitorId: string; projectId: string },
    @Body() body: UpdateSdkProjectConfigDto,
  ) {
    await this.playground.assertProjectAccess(projectId, token);
    return apiSuccess(await this.sdkConfig.updateConfig(projectId, body));
  }
}
