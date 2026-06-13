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
import { AppPagesController } from './app-pages.controller';
import { AppPagesService } from './app-pages.service';
import { ActionSelectorService } from './action-selector.service';
import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';
import {
  ActionSection,
  ActionSectionSchema,
} from './schemas/action-section.schema';
import { AppPage, AppPageSchema } from './schemas/app-page.schema';
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
    ]),
    ProjectsModule,
    forwardRef(() => StudioBillingModule),
    LlmModule,
  ],
  controllers: [ActionsController, ActionSectionsController, AppPagesController],
  providers: [
    ActionsService,
    ActionSectionsService,
    AppPagesService,
    ActionSchemaValidator,
    ActionSelectorService,
    ActionRunnerService,
  ],
  exports: [
    ActionsService,
    ActionSectionsService,
    AppPagesService,
    ActionSelectorService,
    ActionRunnerService,
  ],
})
export class ActionsModule {}
