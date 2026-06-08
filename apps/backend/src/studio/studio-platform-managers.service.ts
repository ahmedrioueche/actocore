import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type {
  CreatePlatformManagerDto,
  PlatformManagerData,
  PlatformPermission,
  UpdatePlatformManagerDto,
} from '@ahmedrioueche/actocore-shared';
import {
  ALL_PLATFORM_PERMISSIONS,
  ErrorCode,
  StudioRole,
} from '@ahmedrioueche/actocore-shared';
import { Model } from 'mongoose';
import { asMongoObjectId } from './utils/mongo-object-id.util';
import type { StudioAuthConfig } from '../config/studio-auth.config';
import type { StudioRequestContext } from './studio-context';
import {
  StudioMembership,
  StudioMembershipDocument,
} from './schemas/studio-membership.schema';
import { StudioUser, StudioUserDocument } from './schemas/studio-user.schema';
import { StudioPlatformAuthService } from './studio-platform-auth.service';
import { StudioPlatformBootstrapService } from './studio-platform-bootstrap.service';
import { hashPassword } from './utils/password-crypto';
import {
  assertValidStudioSeatUsername,
  normalizeStudioSeatUsername,
} from './utils/studio-seat.util';
import { resolvePlatformPermissionsForMembership } from './utils/platform-permissions.util';

@Injectable()
export class StudioPlatformManagersService {
  constructor(
    private readonly bootstrap: StudioPlatformBootstrapService,
    private readonly platformAuth: StudioPlatformAuthService,
    @InjectModel(StudioUser.name)
    private readonly userModel: Model<StudioUserDocument>,
    @InjectModel(StudioMembership.name)
    private readonly membershipModel: Model<StudioMembershipDocument>,
    private readonly config: ConfigService,
  ) {}

  async list(ctx: StudioRequestContext): Promise<PlatformManagerData[]> {
    this.platformAuth.assertPlatformContext(ctx);
    const platformAccountObjectId = this.bootstrap.getPlatformAccountObjectId()!;

    const memberships = await this.membershipModel
      .find({ accountId: platformAccountObjectId, role: StudioRole.SUPER_ADMIN })
      .sort({ createdAt: 1 })
      .exec();
    const users = await this.userModel
      .find({ _id: { $in: memberships.map((m) => m.userId) } })
      .exec();
    const userById = new Map(users.map((u) => [u._id.toString(), u]));

    return memberships
      .map((m) => {
        const user = userById.get(m.userId.toString());
        if (!user) {
          return null;
        }
        return this.toManagerData(user, m);
      })
      .filter((row): row is PlatformManagerData => row != null);
  }

  async create(
    ctx: StudioRequestContext,
    body: CreatePlatformManagerDto,
  ): Promise<PlatformManagerData> {
    this.platformAuth.assertPlatformContext(ctx);
    await this.assertCanManageTeam(ctx, body.permissions);

    const platformAccountObjectId = this.bootstrap.getPlatformAccountObjectId()!;
    const loginName = assertValidStudioSeatUsername(body.username);
    const normalized = normalizeStudioSeatUsername(loginName);

    const existing = await this.userModel
      .findOne({ platformLoginName: normalized })
      .exec();
    if (existing) {
      throw new ConflictException({
        errorCode: ErrorCode.USER_ALREADY_EXISTS,
        message: 'Username is already taken',
      });
    }

    const passwordHash = await hashPassword(
      body.password,
      this.authConfig().passwordPepper,
    );

    const user = await this.userModel.create({
      platformLoginName: normalized,
      passwordHash,
      displayName: body.displayName?.trim() || normalized,
      emailVerified: true,
      isPlatformMaster: false,
    });

    try {
      const membership = await this.membershipModel.create({
        userId: user._id,
        accountId: platformAccountObjectId,
        role: StudioRole.SUPER_ADMIN,
        permissions: body.permissions,
        projectIds: [],
        loginName: normalized,
      });

      return this.toManagerData(user, membership);
    } catch (error) {
      await this.userModel.deleteOne({ _id: user._id }).exec();
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException({
          errorCode: ErrorCode.USER_ALREADY_EXISTS,
          message: 'Username is already taken',
        });
      }
      throw error;
    }
  }

  async update(
    ctx: StudioRequestContext,
    userId: string,
    body: UpdatePlatformManagerDto,
  ): Promise<PlatformManagerData> {
    this.platformAuth.assertPlatformContext(ctx);

    const platformAccountObjectId = this.bootstrap.getPlatformAccountObjectId()!;
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException({
        errorCode: ErrorCode.NOT_FOUND,
        message: 'Manager not found',
      });
    }
    if (this.bootstrap.isMasterUser(user)) {
      throw new ForbiddenException({
        errorCode: ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: 'Cannot modify the platform master account',
      });
    }

    const membership = await this.membershipModel
      .findOne({
        userId: user._id,
        accountId: platformAccountObjectId,
        role: StudioRole.SUPER_ADMIN,
      })
      .exec();
    if (!membership) {
      throw new NotFoundException({
        errorCode: ErrorCode.NOT_FOUND,
        message: 'Manager not found',
      });
    }

    if (body.permissions !== undefined) {
      await this.assertCanManageTeam(ctx, body.permissions);
      membership.permissions = body.permissions;
    }
    if (body.displayName !== undefined) {
      user.displayName = body.displayName.trim() || undefined;
    }
    if (body.password) {
      user.passwordHash = await hashPassword(
        body.password,
        this.authConfig().passwordPepper,
      );
      user.tokenVersion += 1;
    }

    await Promise.all([user.save(), membership.save()]);
    return this.toManagerData(user, membership);
  }

  async remove(ctx: StudioRequestContext, userId: string): Promise<{ message: string }> {
    this.platformAuth.assertPlatformContext(ctx);

    const platformAccountObjectId = this.bootstrap.getPlatformAccountObjectId()!;
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException({
        errorCode: ErrorCode.NOT_FOUND,
        message: 'Manager not found',
      });
    }
    if (this.bootstrap.isMasterUser(user)) {
      throw new ForbiddenException({
        errorCode: ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: 'Cannot remove the platform master account',
      });
    }

    await this.membershipModel
      .deleteOne({
        userId: user._id,
        accountId: platformAccountObjectId,
      })
      .exec();
    await this.userModel.deleteOne({ _id: user._id }).exec();

    return { message: 'Manager removed' };
  }

  private async assertCanManageTeam(
    ctx: StudioRequestContext,
    targetPermissions: PlatformPermission[],
  ): Promise<void> {
    const actor = await this.userModel.findById(ctx.userId).exec();
    const membership = await this.membershipModel
      .findOne({
        userId: asMongoObjectId(ctx.userId),
        accountId: this.bootstrap.getPlatformAccountObjectId(),
      })
      .exec();
    if (!actor || !membership) {
      throw new ForbiddenException({
        errorCode: ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: 'Platform operator access required',
      });
    }

    if (this.bootstrap.isMasterUser(actor)) {
      return;
    }

    const granted = resolvePlatformPermissionsForMembership(actor, membership);
    const canManage = granted.includes('platform.team.write' as PlatformPermission);
    if (!canManage) {
      throw new ForbiddenException({
        errorCode: ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: 'Platform team management permission required',
      });
    }

    const invalid = targetPermissions.filter(
      (p) => !granted.includes(p),
    );
    if (invalid.length > 0) {
      throw new BadRequestException({
        errorCode: ErrorCode.VALIDATION_ERROR,
        message: 'Cannot grant permissions you do not have',
      });
    }

    const allValid = targetPermissions.every((p) =>
      ALL_PLATFORM_PERMISSIONS.includes(p),
    );
    if (!allValid || targetPermissions.length === 0) {
      throw new BadRequestException({
        errorCode: ErrorCode.VALIDATION_ERROR,
        message: 'At least one valid platform permission is required',
      });
    }
  }

  private toManagerData(
    user: StudioUserDocument,
    membership: StudioMembershipDocument,
  ): PlatformManagerData {
    return {
      userId: user._id.toString(),
      username: user.platformLoginName ?? '',
      displayName: user.displayName,
      isMaster: this.bootstrap.isMasterUser(user),
      permissions: resolvePlatformPermissionsForMembership(user, membership),
      createdAt: (membership.createdAt ?? new Date()).toISOString(),
      updatedAt: (membership.updatedAt ?? new Date()).toISOString(),
    };
  }

  private authConfig(): StudioAuthConfig {
    return this.config.getOrThrow<StudioAuthConfig>('studioAuth');
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }
}
