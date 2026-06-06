import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'project_action_sections', timestamps: true })
export class ActionSection {
  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop()
  color?: string;

  @Prop({ default: true })
  enabled!: boolean;

  @Prop({ default: 0 })
  order!: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export type ActionSectionDocument = HydratedDocument<ActionSection>;
export const ActionSectionSchema = SchemaFactory.createForClass(ActionSection);

ActionSectionSchema.index({ projectId: 1, name: 1 }, { unique: true });
ActionSectionSchema.index({ projectId: 1, order: 1 });
