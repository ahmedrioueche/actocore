import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const StudioTeamAuditAction = {
  SEAT_CREATED: 'seat.created',
  SEAT_UPDATED: 'seat.updated',
  SEAT_REMOVED: 'seat.removed',
} as const;

export type StudioTeamAuditAction =
  (typeof StudioTeamAuditAction)[keyof typeof StudioTeamAuditAction];

@Schema({ collection: 'studio_team_audit', timestamps: true })
export class StudioTeamAudit {
  @Prop({ required: true, index: true })
  accountId!: string;

  @Prop({ required: true })
  action!: StudioTeamAuditAction;

  @Prop({ required: true })
  targetUserId!: string;

  @Prop({ required: true })
  actorUserId!: string;

  @Prop({ type: Object })
  meta?: Record<string, unknown>;

  createdAt?: Date;
}

export type StudioTeamAuditDocument = HydratedDocument<StudioTeamAudit>;
export const StudioTeamAuditSchema =
  SchemaFactory.createForClass(StudioTeamAudit);

StudioTeamAuditSchema.index({ accountId: 1, createdAt: -1 });
