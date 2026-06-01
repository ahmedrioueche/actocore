import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { ProjectSettings } from '@ahmedrioueche/actocore-shared';

@Schema({ collection: 'projects', timestamps: true })
export class Project {
  @Prop({ required: true })
  name!: string;

  @Prop({
    type: {
      systemPrompt: { type: String },
      rules: { type: [String], default: [] },
      tone: { type: String },
    },
    default: () => ({}),
  })
  settings!: ProjectSettings;

  createdAt?: Date;
  updatedAt?: Date;
}

export type ProjectDocument = HydratedDocument<Project>;
export const ProjectSchema = SchemaFactory.createForClass(Project);
