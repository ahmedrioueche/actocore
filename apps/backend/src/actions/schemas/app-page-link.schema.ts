import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'project_app_page_links', timestamps: true })
export class AppPageLink {
  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true })
  sourcePageId!: string;

  @Prop({ required: true })
  targetPageId!: string;

  @Prop()
  label?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export type AppPageLinkDocument = HydratedDocument<AppPageLink>;
export const AppPageLinkSchema = SchemaFactory.createForClass(AppPageLink);

AppPageLinkSchema.index(
  { projectId: 1, sourcePageId: 1, targetPageId: 1 },
  { unique: true },
);
