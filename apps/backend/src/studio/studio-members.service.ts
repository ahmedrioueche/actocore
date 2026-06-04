import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type {
  CreateStudioMemberDto,
  StudioMemberData,
  UpdateStudioMemberDto,
} from '@ahmedrioueche/actocore-shared';
import {
  ErrorCode,
  resolveStudioPermissions,
  StudioPermission,
  StudioRole,
} from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
import type { StudioAuthConfig } from '../config/studio-auth.config';
import { StudioAccessService } from './studio-access.service';
import type { StudioRequestContext } from './studio-context';
import {
  StudioMembership,
  StudioMembershipDocument,
} from './schemas/studio-membership.schema';
import { StudioUser, StudioUserDocument } from './schemas/studio-user.schema';
import { StudioEntitlementsService } from '../studio-billing/studio-entitlements.service';
import { ProjectsService } from '../projects/projects.service';
import { StudioAccountDeleteService } from './studio-account-delete.service';
import { StudioTeamAuditService } from './studio-team-audit.service';
import { StudioTeamAuditAction } from './schemas/studio-team-audit.schema';
import { hashPassword } from './utils/password-crypto';
import {
  assertValidStudioSeatUsername,
  normalizeStudioSeatUsername,
} from './utils/studio-seat.util';

@Injectable()
export class StudioMembersService {
  constructor(
    @InjectModel(StudioUser.name)
    private readonly userModel: Model<StudioUserDocument>,
    @InjectModel(StudioMembership.name)
    private readonly membershipModel: Model<StudioMembershipDocument>,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projects: ProjectsService,
    private readonly access: StudioAccessService,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => StudioEntitlementsService))
    private readonly entitlements: StudioEntitlementsService,
    private readonly accountDelete: StudioAccountDeleteService,
    private readonly teamAudit: StudioTeamAuditService,
  ) {}

  async listAudit(
    ctx: StudioRequestContext,
    limit = 50,
  ) {
    return this.teamAudit.list(ctx.accountId, limit);
  }

  async list(ctx: StudioRequestContext): Promise<StudioMemberData[]> {
    const memberships = await this.membershipModel
      .find({ accountId: ctx.accountId })
      .sort({ createdAt: 1 })
      .exec();

    const users = await this.userModel
      .find({
        _id: { $in: memberships.map((m) => m.userId) },
      })
      .exec();
    const userById = new Map(users.map((u) => [u._id.toString(), u]));

    return memberships.map((m) => {
      const user = userById.get(m.userId.toString());
      return this.toMemberData(m, user);
    });
  }

  async createEditor(
    ctx: StudioRequestContext,
    body: CreateStudioMemberDto,
  ): Promise<StudioMemberData> {
    const role = body.role ?? StudioRole.USER_EDITOR;
    if (role !== StudioRole.USER_EDITOR) {
      throw new ForbiddenException({
        errorCode: ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: 'Only editor seats can be created here',
      });
    }

    await this.entitlements.assertCanAddTeamMember(ctx.accountId);

    const loginName = assertValidStudioSeatUsername(body.username);
    await this.assertLoginNameAvailable(ctx.accountId, loginName);

    for (const projectId of body.projectIds) {
      await this.projects.assertExistsForAccount(ctx, projectId);
      this.access.assertProjectAccess(ctx, projectId);
    }

    const passwordHash = await hashPassword(
      body.password,
      this.config.getOrThrow<StudioAuthConfig>('studioAuth').passwordPepper,
    );

    const user = await this.userModel.create({
      passwordHash,
      displayName: body.displayName?.trim(),
      emailVerified: true,
    });

    const permissions =
      body.permissions && body.permissions.length > 0
        ? body.permissions
        : resolveStudioPermissions(StudioRole.USER_EDITOR, null);

    const membership = await this.membershipModel.create({
      userId: user._id,
      accountId: new Types.ObjectId(ctx.accountId),
      role: StudioRole.USER_EDITOR,
      loginName,
      permissions,
      projectIds: body.projectIds,
    });

    await this.teamAudit.log(ctx, StudioTeamAuditAction.SEAT_CREATED, user._id.toString(), {
      username: loginName,
      projectIds: body.projectIds,
    });

    return this.toMemberData(membership, user);
  }

  async updateEditor(
    ctx: StudioRequestContext,
    targetUserId: string,
    body: UpdateStudioMemberDto,
  ): Promise<StudioMemberData> {
    const { membership, user } = await this.findEditorMembership(
      ctx.accountId,
      targetUserId,
    );

    if (body.username !== undefined) {
      const loginName = assertValidStudioSeatUsername(body.username);
      if (loginName !== membership.loginName) {
        await this.assertLoginNameAvailable(ctx.accountId, loginName, targetUserId);
        membership.loginName = loginName;
      }
    }

    if (body.projectIds !== undefined) {
      for (const projectId of body.projectIds) {
        await this.projects.assertExistsForAccount(ctx, projectId);
        this.access.assertProjectAccess(ctx, projectId);
      }
      membership.projectIds = body.projectIds;
    }

    if (body.permissions !== undefined) {
      membership.permissions = body.permissions;
    }

    if (body.displayName !== undefined) {
      user.displayName = body.displayName.trim() || undefined;
      await user.save();
    }

    if (body.password !== undefined) {
      user.passwordHash = await hashPassword(
        body.password,
        this.config.getOrThrow<StudioAuthConfig>('studioAuth').passwordPepper,
      );
      user.tokenVersion += 1;
      await user.save();
    }

    await membership.save();

    await this.teamAudit.log(ctx, StudioTeamAuditAction.SEAT_UPDATED, user._id.toString(), {
      username: membership.loginName,
      projectIds: membership.projectIds,
    });

    return this.toMemberData(membership, user);
  }

  async removeEditor(
    ctx: StudioRequestContext,
    targetUserId: string,
  ): Promise<{ message: string }> {
    if (targetUserId === ctx.userId) {
      throw new BadRequestException({
        errorCode: ErrorCode.CANNOT_REMOVE_SELF,
        message: 'You cannot remove your own seat. Ask another admin.',
      });
    }

    const membership = await this.membershipModel
      .findOne({
        userId: new Types.ObjectId(targetUserId),
        accountId: new Types.ObjectId(ctx.accountId),
      })
      .exec();

    if (!membership) {
      throw new NotFoundException({
        errorCode: ErrorCode.TEAM_MEMBER_NOT_FOUND,
        message: 'Team member not found',
      });
    }

    if (membership.role !== StudioRole.USER_EDITOR) {
      throw new ForbiddenException({
        errorCode: ErrorCode.CANNOT_REMOVE_ADMIN,
        message: 'Workspace owners cannot be removed from the team list',
      });
    }

    await this.accountDelete.removeEditorMembership(targetUserId, ctx.accountId);

    await this.teamAudit.log(ctx, StudioTeamAuditAction.SEAT_REMOVED, targetUserId, {
      username: membership.loginName,
    });

    return { message: 'Team member removed.' };
  }

  private async findEditorMembership(
    accountId: string,
    userId: string,
  ): Promise<{
    membership: StudioMembershipDocument;
    user: StudioUserDocument;
  }> {
    const membership = await this.membershipModel
      .findOne({
        userId: new Types.ObjectId(userId),
        accountId: new Types.ObjectId(accountId),
      })
      .exec();

    if (!membership) {
      throw new NotFoundException({
        errorCode: ErrorCode.TEAM_MEMBER_NOT_FOUND,
        message: 'Team member not found',
      });
    }

    if (membership.role !== StudioRole.USER_EDITOR) {
      throw new ForbiddenException({
        errorCode: ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: 'Only editor seats can be updated here',
      });
    }

    const user = await this.userModel.findById(membership.userId).exec();
    if (!user) {
      throw new NotFoundException({
        errorCode: ErrorCode.TEAM_MEMBER_NOT_FOUND,
        message: 'Team member not found',
      });
    }

    return { membership, user };
  }

  private async assertLoginNameAvailable(
    accountId: string,
    loginName: string,
    excludeUserId?: string,
  ): Promise<void> {
    const existing = await this.membershipModel
      .findOne({
        accountId: new Types.ObjectId(accountId),
        loginName: normalizeStudioSeatUsername(loginName),
      })
      .exec();

    if (existing && existing.userId.toString() !== excludeUserId) {
      throw new ConflictException({
        errorCode: ErrorCode.USER_ALREADY_EXISTS,
        message: 'Username is already taken in this workspace',
      });
    }
  }

  private toMemberData(
    membership: StudioMembershipDocument,
    user?: StudioUserDocument,
  ): StudioMemberData {
    const permissions = resolveStudioPermissions(
      membership.role,
      membership.permissions,
    );
    return {
      userId: membership.userId.toString(),
      username: membership.loginName,
      email: user?.email,
      displayName: user?.displayName,
      role: membership.role,
      permissions,
      projectIds: membership.projectIds ?? [],
      createdAt: (membership.createdAt ?? new Date()).toISOString(),
    };
  }

  static assertTeamWrite(ctx: StudioRequestContext): void {
    if (
      ctx.role !== StudioRole.USER_ADMIN &&
      ctx.role !== StudioRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException({
        errorCode: ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: 'Admin access required',
      });
    }
    if (
      ctx.role === StudioRole.USER_ADMIN &&
      !ctx.permissions.includes(StudioPermission.TEAM_WRITE)
    ) {
      throw new ForbiddenException({
        errorCode: ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: 'Team management not allowed',
      });
    }
  }
}
