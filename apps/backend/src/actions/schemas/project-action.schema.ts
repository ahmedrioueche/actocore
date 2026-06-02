import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { ActionInputSchema } from '@ahmedrioueche/actocore-shared';

@Schema({ collection: 'project_actions', timestamps: true })
export class ProjectAction {
  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ type: Object, required: true })
  inputSchema!: ActionInputSchema;

  @Prop({ default: true })
  enabled!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export type ProjectActionDocument = HydratedDocument<ProjectAction>;
export const ProjectActionSchema = SchemaFactory.createForClass(ProjectAction);

ProjectActionSchema.index({ projectId: 1, name: 1 }, { unique: true });
