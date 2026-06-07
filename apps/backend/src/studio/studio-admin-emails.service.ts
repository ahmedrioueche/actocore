import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StudioRole } from '@ahmedrioueche/actocore-shared';
import {
  StudioMembership,
  StudioMembershipDocument,
} from './schemas/studio-membership.schema';
import { StudioUser, StudioUserDocument } from './schemas/studio-user.schema';

@Injectable()
export class StudioAdminEmailsService {
  constructor(
    @InjectModel(StudioMembership.name)
    private readonly membershipModel: Model<StudioMembershipDocument>,
    @InjectModel(StudioUser.name)
    private readonly userModel: Model<StudioUserDocument>,
  ) {}

  async resolveForAccount(accountId: string): Promise<string[]> {
    const memberships = await this.membershipModel
      .find({
        accountId,
        role: { $in: [StudioRole.USER_ADMIN, StudioRole.SUPER_ADMIN] },
      })
      .exec();
    if (memberships.length === 0) {
      return [];
    }
    const users = await this.userModel
      .find({ _id: { $in: memberships.map((m) => m.userId) } })
      .exec();
    return users
      .map((u) => u.email)
      .filter((e): e is string => typeof e === 'string' && e.length > 0);
  }
}
