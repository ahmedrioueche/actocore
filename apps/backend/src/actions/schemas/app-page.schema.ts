import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'project_app_pages', timestamps: true })
export class AppPage {
  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true })
  slug!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  route!: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  enabled!: boolean;

  @Prop({ default: 0 })
  order!: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export type AppPageDocument = HydratedDocument<AppPage>;
export const AppPageSchema = SchemaFactory.createForClass(AppPage);

AppPageSchema.index({ projectId: 1, slug: 1 }, { unique: true });
AppPageSchema.index({ projectId: 1, order: 1 });
