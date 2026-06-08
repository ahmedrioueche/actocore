import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import type {
  PlatformAuthMeData,
  PlatformChangePasswordDto,
  PlatformLoginDto,
  PlatformSessionData,
  StudioChangePasswordDto,
  StudioRefreshResultData,
  UpdateStudioProfileDto,
} from '@ahmedrioueche/actocore-shared';
import {
  ErrorCode,
  StudioRole,
} from '@ahmedrioueche/actocore-shared';
import { Model } from 'mongoose';
import { asMongoObjectId } from './utils/mongo-object-id.util';
import type { PlatformAuthConfig } from '../config/platform-auth.config';
import type { StudioAuthConfig } from '../config/studio-auth.config';
import { StudioAuthException } from './exceptions/studio-auth.exception';
import { StudioAccount, StudioAccountDocument } from './schemas/studio-account.schema';
import {
  StudioMembership,
  StudioMembershipDocument,
} from './schemas/studio-membership.schema';
import { StudioUser, StudioUserDocument } from './schemas/studio-user.schema';
import { StudioPlatformBootstrapService } from './studio-platform-bootstrap.service';
import { hashPassword, verifyPassword } from './utils/password-crypto';
import { assertValidStudioSeatUsername } from './utils/studio-seat.util';
import { resolvePlatformPermissionsForMembership } from './utils/platform-permissions.util';
import type { StudioRequestContext } from './studio-context';

type JwtPayload = {
  sub: string;
  aid: string;
  role: StudioRole;
  tv: number;
};

@Injectable()
export class StudioPlatformAuthService {
  constructor(
    private readonly bootstrap: StudioPlatformBootstrapService,
    @InjectModel(StudioUser.name)
    private readonly userModel: Model<StudioUserDocument>,
    @InjectModel(StudioAccount.name)
    private readonly accountModel: Model<StudioAccountDocument>,
    @InjectModel(StudioMembership.name)
    private readonly membershipModel: Model<StudioMembershipDocument>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(body: PlatformLoginDto): Promise<PlatformSessionData> {
    const hasEmail = Boolean(body.email?.trim());
    const hasUsername = Boolean(body.username?.trim());
    if (hasEmail === hasUsername) {
      throw new BadRequestException({
        errorCode: ErrorCode.VALIDATION_ERROR,
        message: 'Sign in with master email + password or manager username + password.',
      });
    }

    const platformAccountId = await this.bootstrap.getPlatformAccountIdReady();
    if (!platformAccountId) {
      throw new StudioAuthException(
        ErrorCode.UNAUTHORIZED,
        'Platform admin is not configured',
      );
    }

    if (hasEmail) {
      return this.loginMaster(body.email!.trim().toLowerCase(), body.password);
    }

    return this.loginManager(
      assertValidStudioSeatUsername(body.username!),
      body.password,
      platformAccountId,
    );
  }

  async refresh(refreshToken: string): Promise<StudioRefreshResultData> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.studioAuth().jwtRefreshSecret,
      });
    } catch {
      throw new StudioAuthException(
        ErrorCode.UNAUTHORIZED,
        'Invalid or expired refresh token',
      );
    }

    const platformAccountId = this.bootstrap.getPlatformAccountId();
    if (!platformAccountId || payload.aid !== platformAccountId) {
      throw new StudioAuthException(
        ErrorCode.UNAUTHORIZED,
        'Invalid platform session',
      );
    }

    const user = await this.userModel.findById(payload.sub).exec();
    if (!user || user.tokenVersion !== payload.tv) {
      throw new StudioAuthException(
        ErrorCode.UNAUTHORIZED,
        'Session is no longer valid',
      );
    }

    const accessToken = await this.signAccessToken(
      user,
      platformAccountId,
      StudioRole.SUPER_ADMIN,
      user.tokenVersion,
    );
    return { accessToken };
  }

  async getMe(ctx: StudioRequestContext): Promise<PlatformAuthMeData> {
    this.assertPlatformContext(ctx);
    const platformAccountId = this.bootstrap.getPlatformAccountId()!;

    const user = await this.userModel.findById(ctx.userId).exec();
    const membership = await this.membershipModel
      .findOne({
        userId: asMongoObjectId(ctx.userId),
        accountId: this.bootstrap.getPlatformAccountObjectId(),
      })
      .exec();

    if (!user || !membership) {
      throw new StudioAuthException(
        ErrorCode.UNAUTHORIZED,
        'Platform session is no longer valid',
      );
    }

    return this.toPlatformMe(user, membership, platformAccountId);
  }

  async updateProfile(
    ctx: StudioRequestContext,
    body: UpdateStudioProfileDto,
  ): Promise<PlatformAuthMeData> {
    this.assertPlatformContext(ctx);
    const user = await this.userModel.findById(ctx.userId).exec();
    if (!user) {
      throw new StudioAuthException(ErrorCode.USER_NOT_FOUND, 'User not found');
    }

    if (body.displayName !== undefined) {
      user.displayName = body.displayName.trim() || undefined;
    }
    if (body.picture !== undefined) {
      user.picture = body.picture.trim() || undefined;
    }
    await user.save();

    return this.getMe(ctx);
  }

  async changePassword(
    ctx: StudioRequestContext,
    body: PlatformChangePasswordDto,
  ): Promise<{ message: string }> {
    this.assertPlatformContext(ctx);
    const user = await this.userModel.findById(ctx.userId).exec();
    if (!user) {
      throw new StudioAuthException(ErrorCode.USER_NOT_FOUND, 'User not found');
    }
    if (this.bootstrap.isMasterUser(user)) {
      throw new BadRequestException({
        errorCode: ErrorCode.VALIDATION_ERROR,
        message: 'Master account password is managed via environment variables',
      });
    }
    if (!user.passwordHash) {
      throw new StudioAuthException(
        ErrorCode.INVALID_CREDENTIALS,
        'Password not set',
      );
    }

    const valid = await verifyPassword(
      body.currentPassword,
      this.studioAuth().passwordPepper,
      user.passwordHash,
    );
    if (!valid) {
      throw new StudioAuthException(
        ErrorCode.INVALID_CREDENTIALS,
        'Current password is incorrect',
      );
    }

    user.passwordHash = await hashPassword(
      body.newPassword,
      this.studioAuth().passwordPepper,
    );
    user.tokenVersion += 1;
    await user.save();

    return { message: 'Password updated' };
  }

  assertPlatformContext(ctx: StudioRequestContext): void {
    if (!this.bootstrap.isPlatformAccount(ctx.accountId)) {
      throw new UnauthorizedException({
        errorCode: ErrorCode.UNAUTHORIZED,
        message: 'Platform operator session required',
      });
    }
    if (ctx.role !== StudioRole.SUPER_ADMIN) {
      throw new UnauthorizedException({
        errorCode: ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: 'Platform operator session required',
      });
    }
  }

  private async loginMaster(
    email: string,
    password: string,
  ): Promise<PlatformSessionData> {
    const { masterEmail, masterPassword } = this.platformAuth();
    if (!masterEmail || !masterPassword) {
      throw new StudioAuthException(
        ErrorCode.UNAUTHORIZED,
        'Platform master login is not configured',
      );
    }

    if (email !== masterEmail || password !== masterPassword) {
      throw new StudioAuthException(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid email or password',
      );
    }

    const user = await this.userModel.findOne({ email: masterEmail }).exec();
    const platformAccountId = await this.bootstrap.getPlatformAccountIdReady();
    if (!user || !platformAccountId) {
      throw new StudioAuthException(
        ErrorCode.UNAUTHORIZED,
        'Platform master is not bootstrapped',
      );
    }

    const platformAccountObjectId =
      this.bootstrap.getPlatformAccountObjectId();
    const membership = await this.membershipModel
      .findOne({
        userId: user._id,
        accountId: platformAccountObjectId,
      })
      .exec();
    const account = await this.accountModel.findById(platformAccountId).exec();
    if (!membership || !account) {
      throw new StudioAuthException(
        ErrorCode.UNAUTHORIZED,
        'Platform master is not bootstrapped',
      );
    }

    return this.buildSession(user, account, membership);
  }

  private async loginManager(
    username: string,
    password: string,
    platformAccountId: string,
  ): Promise<PlatformSessionData> {
    const user = await this.userModel
      .findOne({ platformLoginName: username })
      .exec();
    if (!user?.passwordHash) {
      throw new StudioAuthException(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid username or password',
      );
    }

    const valid = await verifyPassword(
      password,
      this.studioAuth().passwordPepper,
      user.passwordHash,
    );
    if (!valid) {
      throw new StudioAuthException(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid username or password',
      );
    }

    const membership = await this.membershipModel
      .findOne({
        userId: user._id,
        accountId: this.bootstrap.getPlatformAccountObjectId(),
        role: StudioRole.SUPER_ADMIN,
      })
      .exec();
    const account = await this.accountModel.findById(platformAccountId).exec();
    if (!membership || !account || this.bootstrap.isMasterUser(user)) {
      throw new StudioAuthException(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid username or password',
      );
    }

    return this.buildSession(user, account, membership);
  }

  private async buildSession(
    user: StudioUserDocument,
    account: StudioAccountDocument,
    membership: StudioMembershipDocument,
  ): Promise<PlatformSessionData> {
    const platformAccountId = account._id.toString();
    const platformPermissions = resolvePlatformPermissionsForMembership(
      user,
      membership,
    );
    const accessToken = await this.signAccessToken(
      user,
      platformAccountId,
      StudioRole.SUPER_ADMIN,
      user.tokenVersion,
    );
    const refreshToken = await this.jwt.signAsync(
      {
        sub: user._id.toString(),
        aid: platformAccountId,
        role: StudioRole.SUPER_ADMIN,
        tv: user.tokenVersion,
      } satisfies JwtPayload,
      {
        secret: this.studioAuth().jwtRefreshSecret,
        expiresIn: this.studioAuth().jwtRefreshExpiresIn as `${number}d`,
      },
    );

    const me = this.toPlatformMe(user, membership, platformAccountId);

    return {
      accessToken,
      refreshToken,
      ...me,
    };
  }

  private toPlatformMe(
    user: StudioUserDocument,
    membership: StudioMembershipDocument,
    platformAccountId: string,
  ): PlatformAuthMeData {
    const platformPermissions = resolvePlatformPermissionsForMembership(
      user,
      membership,
    );

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.platformLoginName ?? membership.loginName,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        picture: user.picture,
        createdAt: (user.createdAt ?? new Date()).toISOString(),
        updatedAt: (user.updatedAt ?? new Date()).toISOString(),
      },
      platformAccountId,
      isPlatformMaster: this.bootstrap.isMasterUser(user),
      platformPermissions,
    };
  }

  private signAccessToken(
    user: StudioUserDocument,
    accountId: string,
    role: StudioRole,
    tokenVersion: number,
  ) {
    return this.jwt.signAsync(
      {
        sub: user._id.toString(),
        aid: accountId,
        role,
        tv: tokenVersion,
      } satisfies JwtPayload,
      {
        secret: this.studioAuth().jwtSecret,
        expiresIn: this.studioAuth().jwtAccessExpiresIn as `${number}m`,
      },
    );
  }

  private platformAuth(): PlatformAuthConfig {
    return this.config.getOrThrow<PlatformAuthConfig>('platformAuth');
  }

  private studioAuth(): StudioAuthConfig {
    return this.config.getOrThrow<StudioAuthConfig>('studioAuth');
  }
}
