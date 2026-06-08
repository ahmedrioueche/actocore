import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { StudioRole } from '@ahmedrioueche/actocore-shared';

@Schema({ collection: 'studio_memberships', timestamps: true })
export class StudioMembership {
  @Prop({ type: Types.ObjectId, required: true, ref: 'StudioUser', index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'StudioAccount', index: true })
  accountId!: Types.ObjectId;

  @Prop({ type: String, required: true, enum: Object.values(StudioRole) })
  role!: StudioRole;

  @Prop({ type: [String], default: [] })
  permissions!: string[];

  /** Workspace seat login name (editors only); unique per account. */
  @Prop({ type: String, trim: true, lowercase: true })
  loginName?: string;

  /** Assigned projects for editors; empty = all projects in account (admin). */
  @Prop({ type: [String], default: [] })
  projectIds!: string[];

  createdAt?: Date;
  updatedAt?: Date;
}

export type StudioMembershipDocument = HydratedDocument<StudioMembership>;
export const StudioMembershipSchema =
  SchemaFactory.createForClass(StudioMembership);

StudioMembershipSchema.index({ userId: 1, accountId: 1 }, { unique: true });
StudioMembershipSchema.index(
  { accountId: 1, loginName: 1 },
  {
    unique: true,
    partialFilterExpression: {
      loginName: { $exists: true, $type: 'string' },
    },
  },
);
