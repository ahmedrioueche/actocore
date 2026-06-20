import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudioModule } from '../studio/studio.module';
import { LlmModule } from '../external/llm/llm.module';
import { ProjectsModule } from '../projects/projects.module';
import { StudioBillingModule } from '../studio-billing/studio-billing.module';
import { ActionRunnerService } from './action-runner.service';
import { ActionSchemaValidator } from './action-schema.validator';
import { ActionSectionsController } from './action-sections.controller';
import { ActionSectionsService } from './action-sections.service';
import { AppPageLinksController } from './app-page-links.controller';
import { AppPageLinksService } from './app-page-links.service';
import { AppPagesController } from './app-pages.controller';
import { AppPagesService } from './app-pages.service';
import { ActionSelectorService } from './action-selector.service';
import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';
import { SdkManifestService } from './sdk-manifest.service';
import {
  ActionSection,
  ActionSectionSchema,
} from './schemas/action-section.schema';
import { AppPage, AppPageSchema } from './schemas/app-page.schema';
import {
  AppPageLink,
  AppPageLinkSchema,
} from './schemas/app-page-link.schema';
import {
  KnowledgeChunk,
  KnowledgeChunkSchema,
} from '../knowledge/schemas/knowledge-chunk.schema';
import {
  KnowledgeSource,
  KnowledgeSourceSchema,
} from '../knowledge/schemas/knowledge-source.schema';
import {
  ProjectAction,
  ProjectActionSchema,
} from './schemas/project-action.schema';

@Module({
  imports: [
    StudioModule,
    MongooseModule.forFeature([
      { name: ProjectAction.name, schema: ProjectActionSchema },
      { name: ActionSection.name, schema: ActionSectionSchema },
      { name: AppPage.name, schema: AppPageSchema },
      { name: AppPageLink.name, schema: AppPageLinkSchema },
      { name: KnowledgeSource.name, schema: KnowledgeSourceSchema },
      { name: KnowledgeChunk.name, schema: KnowledgeChunkSchema },
    ]),
    ProjectsModule,
    forwardRef(() => StudioBillingModule),
    LlmModule,
  ],
  controllers: [
    ActionsController,
    ActionSectionsController,
    AppPagesController,
    AppPageLinksController,
  ],
  providers: [
    ActionsService,
    ActionSectionsService,
    AppPagesService,
    AppPageLinksService,
    ActionSchemaValidator,
    ActionSelectorService,
    ActionRunnerService,
    SdkManifestService,
  ],
  exports: [
    ActionsService,
    ActionSectionsService,
    AppPagesService,
    AppPageLinksService,
    ActionSelectorService,
    ActionRunnerService,
    SdkManifestService,
  ],
})
export class ActionsModule {}
