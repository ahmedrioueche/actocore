import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'studio_users', timestamps: true })
export class StudioUser {
  /** Owner/admin identity; seat editors have no email. */
  @Prop({ unique: true, sparse: true, lowercase: true, trim: true })
  email?: string;

  /** Globally unique login for platform managers. */
  @Prop({ unique: true, sparse: true, lowercase: true, trim: true })
  platformLoginName?: string;

  @Prop({ default: false })
  isPlatformMaster!: boolean;

  @Prop()
  passwordHash?: string;

  @Prop()
  displayName?: string;

  @Prop({ default: false })
  emailVerified!: boolean;

  @Prop()
  googleId?: string;

  @Prop()
  picture?: string;

  @Prop()
  verificationToken?: string;

  @Prop()
  verificationTokenExpiry?: Date;

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordTokenExpiry?: Date;

  @Prop({ default: 0 })
  tokenVersion!: number;

  @Prop()
  deleteAccountOtpHash?: string;

  @Prop()
  deleteAccountOtpExpiry?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export type StudioUserDocument = HydratedDocument<StudioUser>;
export const StudioUserSchema = SchemaFactory.createForClass(StudioUser);
