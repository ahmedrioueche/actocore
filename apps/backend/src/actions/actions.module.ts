import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LlmModule } from '../external/llm/llm.module';
import { ProjectsModule } from '../projects/projects.module';
import { ActionRunnerService } from './action-runner.service';
import { ActionSchemaValidator } from './action-schema.validator';
import { ActionSelectorService } from './action-selector.service';
import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';
import {
  ProjectAction,
  ProjectActionSchema,
} from './schemas/project-action.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProjectAction.name, schema: ProjectActionSchema },
    ]),
    ProjectsModule,
    LlmModule,
  ],
  controllers: [ActionsController],
  providers: [
    ActionsService,
    ActionSchemaValidator,
    ActionSelectorService,
    ActionRunnerService,
  ],
  exports: [ActionsService, ActionSelectorService, ActionRunnerService],
})
export class ActionsModule {}
