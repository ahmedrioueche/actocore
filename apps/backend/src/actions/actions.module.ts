import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudioModule } from '../studio/studio.module';
import { LlmModule } from '../external/llm/llm.module';
import { ProjectsModule } from '../projects/projects.module';
import { ActionRunnerService } from './action-runner.service';
import { ActionSchemaValidator } from './action-schema.validator';
import { ActionSectionsController } from './action-sections.controller';
import { ActionSectionsService } from './action-sections.service';
import { ActionSelectorService } from './action-selector.service';
import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';
import {
  ActionSection,
  ActionSectionSchema,
} from './schemas/action-section.schema';
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
    ]),
    ProjectsModule,
    LlmModule,
  ],
  controllers: [ActionsController, ActionSectionsController],
  providers: [
    ActionsService,
    ActionSectionsService,
    ActionSchemaValidator,
    ActionSelectorService,
    ActionRunnerService,
  ],
  exports: [
    ActionsService,
    ActionSectionsService,
    ActionSelectorService,
    ActionRunnerService,
  ],
})
export class ActionsModule {}
