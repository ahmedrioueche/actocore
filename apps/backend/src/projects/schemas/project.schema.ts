import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type {
  ProjectSettings,
  SdkProjectConfigData,
} from '@ahmedrioueche/actocore-shared';

@Schema({ collection: 'projects', timestamps: true })
export class Project {
  @Prop({ required: true, index: true })
  accountId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ default: false, index: true })
  archived!: boolean;

  @Prop({ type: Date })
  archivedAt?: Date;

  @Prop({
    type: {
      systemPrompt: { type: String },
      rules: { type: [String], default: [] },
      tone: { type: String },
    },
    default: () => ({}),
  })
  settings!: ProjectSettings;

  @Prop({ type: Object, default: () => ({ sdkConfigVersion: 0 }) })
  sdkConfig!: SdkProjectConfigData;

  createdAt?: Date;
  updatedAt?: Date;
}

export type ProjectDocument = HydratedDocument<Project>;
export const ProjectSchema = SchemaFactory.createForClass(Project);
