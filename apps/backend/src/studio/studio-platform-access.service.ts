import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { asMongoObjectId } from './utils/mongo-object-id.util';
import type { PlatformPermission } from '@ahmedrioueche/actocore-shared';
import {
  StudioMembership,
  StudioMembershipDocument,
} from './schemas/studio-membership.schema';
import { StudioUser, StudioUserDocument } from './schemas/studio-user.schema';
import { StudioPlatformBootstrapService } from './studio-platform-bootstrap.service';
import { resolvePlatformPermissionsForMembership } from './utils/platform-permissions.util';

@Injectable()
export class StudioPlatformAccessService {
  constructor(
    private readonly bootstrap: StudioPlatformBootstrapService,
    @InjectModel(StudioUser.name)
    private readonly userModel: Model<StudioUserDocument>,
    @InjectModel(StudioMembership.name)
    private readonly membershipModel: Model<StudioMembershipDocument>,
  ) {}

  async resolvePermissionsForUser(
    userId: string,
  ): Promise<PlatformPermission[] | null> {
    const platformAccountObjectId = this.bootstrap.getPlatformAccountObjectId();
    if (!platformAccountObjectId) {
      return null;
    }

    const user = await this.userModel.findById(userId).exec();
    const membership = await this.membershipModel
      .findOne({
        userId: asMongoObjectId(userId),
        accountId: platformAccountObjectId,
      })
      .exec();

    if (!user || !membership) {
      return null;
    }

    return resolvePlatformPermissionsForMembership(user, membership);
  }

  async isMasterUser(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();
    return user != null && this.bootstrap.isMasterUser(user);
  }
}
