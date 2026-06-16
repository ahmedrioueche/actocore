import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  StudioReportStatus,
  StudioReportType,
} from '@ahmedrioueche/actocore-shared';

@Schema({ collection: 'studio_reports', timestamps: true })
export class StudioReport {
  @Prop({ required: true, index: true })
  accountId!: string;

  @Prop({ required: true })
  accountName!: string;

  @Prop({ required: true, index: true })
  reporterUserId!: string;

  @Prop()
  reporterEmail?: string;

  @Prop()
  reporterDisplayName?: string;

  @Prop({ type: String, required: true, enum: Object.values(StudioReportType) })
  type!: StudioReportType;

  @Prop()
  subject?: string;

  @Prop({ required: true })
  message!: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(StudioReportStatus),
    default: StudioReportStatus.OPEN,
    index: true,
  })
  status!: StudioReportStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export type StudioReportDocument = HydratedDocument<StudioReport>;
export const StudioReportSchema = SchemaFactory.createForClass(StudioReport);

StudioReportSchema.index({ accountId: 1, createdAt: -1 });
StudioReportSchema.index({ status: 1, createdAt: -1 });
StudioReportSchema.index({ reporterUserId: 1, createdAt: -1 });
