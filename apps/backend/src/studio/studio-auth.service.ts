import {
  BadRequestException,
  ConflictException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import type {
  StudioAuthMeData,
  StudioChangePasswordDto,
  StudioForgotPasswordDto,
  StudioLoginDto,
  StudioMessageData,
  StudioRefreshResultData,
  StudioResendVerificationDto,
  StudioResetPasswordDto,
  StudioSessionData,
  StudioSignupDto,
  StudioSignupResultData,
  StudioConfirmDeleteAccountDto,
  StudioVerifyEmailDto,
  UpdateStudioProfileDto,
} from '@ahmedrioueche/actocore-shared';
import {
  ErrorCode,
  resolveStudioPermissions,
  StudioRole,
} from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import type { StudioAuthConfig } from '../config/studio-auth.config';
import { StudioAuthException } from './exceptions/studio-auth.exception';
import { ProjectsService } from '../projects/projects.service';
import { StudioSubscriptionService } from '../studio-billing/studio-subscription.service';
import { StudioAccountDeleteService } from './studio-account-delete.service';
import { getAppEnvironment } from '../config/mongodb.config';
import { StudioEmailService } from './studio-email.service';
import { generateNumericOtp, hashOtp, verifyOtp } from './utils/studio-otp.util';
import { StudioAccount, StudioAccountDocument } from './schemas/studio-account.schema';
import {
  StudioMembership,
  StudioMembershipDocument,
} from './schemas/studio-membership.schema';
import { StudioUser, StudioUserDocument } from './schemas/studio-user.schema';
import type { StudioRequestContext } from './studio-context';
import { hashPassword, verifyPassword } from './utils/password-crypto';
import { buildStudioAppUrl } from './utils/studio-redirect.util';
import {
  assertValidStudioSeatUsername,
  isSeatUser,
} from './utils/studio-seat.util';
import { maskEmail } from './utils/mask-email.util';

type JwtPayload = {
  sub: string;
  aid: string;
  role: StudioRole;
  tv: number;
};

@Injectable()
export class StudioAuthService {
  private readonly logger = new Logger(StudioAuthService.name);

  constructor(
    @InjectModel(StudioUser.name)
    private readonly userModel: Model<StudioUserDocument>,
    @InjectModel(StudioAccount.name)
    private readonly accountModel: Model<StudioAccountDocument>,
    @InjectModel(StudioMembership.name)
    private readonly membershipModel: Model<StudioMembershipDocument>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly email: StudioEmailService,
    private readonly accountDelete: StudioAccountDeleteService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projects: ProjectsService,
    @Inject(forwardRef(() => StudioSubscriptionService))
    private readonly subscriptions: StudioSubscriptionService,
  ) {}

  private static readonly DELETE_OTP_TTL_MS = 15 * 60 * 1000;
  private static readonly DELETE_OTP_RESEND_MS = 60 * 1000;
  private static readonly GOOGLE_OAUTH_CODE_TTL_MS = 5 * 60 * 1000;

  private readonly pendingGoogleOAuth = new Map<
    string,
    { session: StudioSessionData; expiresAt: number }
  >();

  async signup(body: StudioSignupDto): Promise<StudioSignupResultData> {
    const email = body.email.trim().toLowerCase();
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) {
      throw new ConflictException({
        errorCode: ErrorCode.USER_ALREADY_EXISTS,
        message: 'An account with this email already exists',
      });
    }

    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const passwordHash = await hashPassword(
      body.password,
      this.getConfig().passwordPepper,
    );

    const account = await this.accountModel.create({ name: body.accountName });
    const user = await this.userModel.create({
      email,
      passwordHash,
      displayName: body.displayName?.trim() || body.accountName,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry,
    });

    const membership = await this.membershipModel.create({
      userId: user._id,
      accountId: account._id,
      role: StudioRole.USER_ADMIN,
      permissions: [],
      projectIds: [],
    });

    const defaultProjectId = await this.maybeCreateDefaultProject(
      account,
      user,
      membership,
    );

    await this.maybeStartFreeTrial(account._id.toString());

    if (process.env.STUDIO_AUTO_VERIFY_EMAIL === 'true') {
      user.emailVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpiry = undefined;
      await user.save();
      return {
        message: 'Account created (auto-verified for tests).',
        email,
        defaultProjectId,
      };
    }

    const verificationDelivery = await this.deliverVerificationEmail(
      email,
      verificationToken,
    );

    return {
      message: verificationDelivery.sent
        ? 'Check your email to verify your account before signing in.'
        : 'Account created. Verification email could not be sent — use resend verification on the login page.',
      email,
      defaultProjectId,
      devVerificationUrl: verificationDelivery.devVerificationUrl,
    };
  }

  private maybeDevVerificationUrl(
    token: string,
    emailDeliveryFailed = false,
  ): string | undefined {
    if (getAppEnvironment() === 'production') {
      return undefined;
    }
    if (!this.email.isEmailConfigured() || emailDeliveryFailed) {
      return this.email.buildVerificationUrl(token);
    }
    return undefined;
  }

  private async deliverVerificationEmail(
    email: string,
    token: string,
  ): Promise<{ sent: boolean; devVerificationUrl?: string }> {
    try {
      await this.email.sendVerificationEmail(email, token);
      return {
        sent: true,
        devVerificationUrl: this.maybeDevVerificationUrl(token),
      };
    } catch (error) {
      this.logger.warn(`Verification email failed for ${email}`, error);
      return {
        sent: false,
        devVerificationUrl: this.maybeDevVerificationUrl(token, true),
      };
    }
  }

  async login(body: StudioLoginDto): Promise<StudioSessionData> {
    const hasSeat =
      Boolean(body.workspaceId?.trim()) || Boolean(body.username?.trim());
    const hasEmail = Boolean(body.email?.trim());

    if (hasEmail === hasSeat) {
      throw new BadRequestException({
        errorCode: ErrorCode.VALIDATION_ERROR,
        message:
          'Sign in with email + password (owner) or workspaceId + username + password (team seat).',
      });
    }

    if (hasEmail) {
      return this.loginWithEmail(body.email!.trim().toLowerCase(), body.password);
    }

    return this.loginWithSeat(
      body.workspaceId!.trim(),
      body.username!,
      body.password,
    );
  }

  private async loginWithEmail(
    email: string,
    password: string,
  ): Promise<StudioSessionData> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user || !user.passwordHash) {
      this.logLoginFailure('email', maskEmail(email), 'user_not_found_or_no_password');
      throw new StudioAuthException(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid email or password',
      );
    }

    const valid = await verifyPassword(
      password,
      this.getConfig().passwordPepper,
      user.passwordHash,
    );
    if (!valid) {
      this.logLoginFailure('email', maskEmail(email), 'wrong_password');
      throw new StudioAuthException(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid email or password',
      );
    }

    if (!user.emailVerified) {
      this.logLoginFailure('email', maskEmail(email), 'email_not_verified');
      throw new StudioAuthException(
        ErrorCode.EMAIL_NOT_VERIFIED,
        'Please verify your email before signing in',
      );
    }

    return this.buildSessionForUser(user);
  }

  private async loginWithSeat(
    workspaceId: string,
    username: string,
    password: string,
  ): Promise<StudioSessionData> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new BadRequestException({
        errorCode: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid workspace id',
      });
    }

    const loginName = assertValidStudioSeatUsername(username);
    const membership = await this.membershipModel
      .findOne({
        accountId: new Types.ObjectId(workspaceId),
        loginName,
        role: StudioRole.USER_EDITOR,
      })
      .exec();

    if (!membership) {
      this.logLoginFailure(
        'seat',
        `workspace=${workspaceId} username=${loginName}`,
        'seat_not_found',
      );
      throw new StudioAuthException(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid workspace, username, or password',
      );
    }

    const user = await this.userModel.findById(membership.userId).exec();
    if (!user?.passwordHash) {
      this.logLoginFailure(
        'seat',
        `workspace=${workspaceId} username=${loginName}`,
        'seat_user_missing_password',
      );
      throw new StudioAuthException(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid workspace, username, or password',
      );
    }

    const valid = await verifyPassword(
      password,
      this.getConfig().passwordPepper,
      user.passwordHash,
    );
    if (!valid) {
      this.logLoginFailure(
        'seat',
        `workspace=${workspaceId} username=${loginName}`,
        'wrong_password',
      );
      throw new StudioAuthException(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid workspace, username, or password',
      );
    }

    const account = await this.accountModel.findById(workspaceId).exec();
    if (!account) {
      this.logLoginFailure(
        'seat',
        `workspace=${workspaceId} username=${loginName}`,
        'workspace_not_found',
      );
      throw new StudioAuthException(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid workspace, username, or password',
      );
    }

    const permissions = resolveStudioPermissions(
      membership.role,
      membership.permissions,
    );

    return this.buildSession(
      user,
      account,
      membership.role,
      permissions,
      membership.projectIds ?? [],
      membership,
    );
  }

  async verifyEmail(body: StudioVerifyEmailDto): Promise<StudioSessionData> {
    const user = await this.userModel
      .findOne({
        verificationToken: body.token,
        verificationTokenExpiry: { $gt: new Date() },
      })
      .exec();

    if (!user) {
      throw new BadRequestException({
        errorCode: ErrorCode.INVALID_VERIFICATION_TOKEN,
        message: 'Invalid or expired verification link',
      });
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    return this.buildSessionForUser(user);
  }

  async resendVerification(
    body: StudioResendVerificationDto,
  ): Promise<StudioMessageData> {
    const email = body.email.trim().toLowerCase();
    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      return { message: 'If an account exists, a verification email was sent.' };
    }

    if (user.emailVerified) {
      throw new BadRequestException({
        errorCode: ErrorCode.EMAIL_ALREADY_VERIFIED,
        message: 'Email is already verified',
      });
    }

    const verificationToken = randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const verificationDelivery = await this.deliverVerificationEmail(
      email,
      verificationToken,
    );

    return {
      message: verificationDelivery.sent
        ? 'Verification email sent.'
        : 'Verification email could not be sent. Try again shortly.',
      devVerificationUrl: verificationDelivery.devVerificationUrl,
    };
  }

  async forgotPassword(body: StudioForgotPasswordDto): Promise<StudioMessageData> {
    const email = body.email.trim().toLowerCase();
    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      return {
        message: 'If an account exists with this email, a reset link was sent.',
      };
    }

    const resetToken = randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    try {
      await this.email.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      this.logger.warn(`Password reset email failed for ${email}`, error);
    }

    return {
      message: 'If an account exists with this email, a reset link was sent.',
    };
  }

  async resetPassword(body: StudioResetPasswordDto): Promise<StudioMessageData> {
    const user = await this.userModel
      .findOne({
        resetPasswordToken: body.token,
        resetPasswordTokenExpiry: { $gt: new Date() },
      })
      .exec();

    if (!user) {
      throw new BadRequestException({
        errorCode: ErrorCode.INVALID_RESET_TOKEN,
        message: 'Invalid or expired reset link',
      });
    }

    user.passwordHash = await hashPassword(
      body.password,
      this.getConfig().passwordPepper,
    );
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;
    user.tokenVersion += 1;
    await user.save();

    return { message: 'Password reset successfully. You can sign in now.' };
  }

  async changePassword(
    ctx: StudioRequestContext,
    body: StudioChangePasswordDto,
  ): Promise<StudioMessageData> {
    const user = await this.userModel.findById(ctx.userId).exec();
    if (!user?.passwordHash) {
      throw new BadRequestException({
        errorCode: ErrorCode.INVALID_CREDENTIALS,
        message: 'Password login is not available for this account',
      });
    }

    const valid = await verifyPassword(
      body.currentPassword,
      this.getConfig().passwordPepper,
      user.passwordHash,
    );
    if (!valid) {
      throw new BadRequestException({
        errorCode: ErrorCode.INVALID_CREDENTIALS,
        message: 'Current password is incorrect',
      });
    }

    user.passwordHash = await hashPassword(
      body.newPassword,
      this.getConfig().passwordPepper,
    );
    user.tokenVersion += 1;
    await user.save();

    return { message: 'Password changed successfully.' };
  }

  async refresh(refreshToken: string): Promise<StudioRefreshResultData> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.getConfig().jwtRefreshSecret,
      });
    } catch {
      throw new StudioAuthException(
        ErrorCode.INVALID_REFRESH_TOKEN,
        'Invalid or expired refresh token',
      );
    }

    const user = await this.userModel.findById(payload.sub).exec();
    if (!user || user.tokenVersion !== payload.tv) {
      throw new StudioAuthException(
        ErrorCode.INVALID_REFRESH_TOKEN,
        'Session expired — sign in again',
      );
    }

    const membership = await this.membershipModel
      .findOne({
        userId: user._id,
        accountId: new Types.ObjectId(payload.aid),
      })
      .exec();
    if (!membership || membership.role !== payload.role) {
      throw new StudioAuthException(
        ErrorCode.INVALID_REFRESH_TOKEN,
        'Session is no longer valid',
      );
    }

    const accessToken = await this.signAccessToken(
      user,
      membership.accountId.toString(),
      membership.role,
      user.tokenVersion,
    );

    return { accessToken };
  }

  async logout(ctx: StudioRequestContext): Promise<StudioMessageData> {
    await this.userModel.findByIdAndUpdate(ctx.userId, {
      $inc: { tokenVersion: 1 },
    });
    return { message: 'Logged out successfully.' };
  }

  async requestDeleteAccountOtp(
    ctx: StudioRequestContext,
  ): Promise<StudioMessageData> {
    const user = await this.userModel.findById(ctx.userId).exec();
    if (!user) {
      throw new StudioAuthException(
        ErrorCode.USER_NOT_FOUND,
        'User not found',
      );
    }

    if (isSeatUser(user)) {
      throw new BadRequestException({
        errorCode: ErrorCode.SEAT_SELF_DELETE_BLOCKED,
        message:
          'Team seats cannot be self-deleted. Ask your workspace admin to remove your access.',
      });
    }

    if (ctx.role === StudioRole.USER_ADMIN) {
      const members = await this.accountDelete.countAccountMembers(ctx.accountId);
      if (members > 1) {
        throw new BadRequestException({
          errorCode: ErrorCode.DELETE_ACCOUNT_BLOCKED,
          message:
            'Remove all team members before deleting the account workspace.',
        });
      }
    }

    const now = Date.now();
    if (
      user.deleteAccountOtpExpiry &&
      user.deleteAccountOtpExpiry > new Date() &&
      now -
        (user.deleteAccountOtpExpiry.getTime() -
          StudioAuthService.DELETE_OTP_TTL_MS) <
        StudioAuthService.DELETE_OTP_RESEND_MS
    ) {
      throw new HttpException(
        {
          errorCode: ErrorCode.TOO_MANY_REQUESTS,
          message: 'Please wait before requesting another code.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const otp = generateNumericOtp(6);
    user.deleteAccountOtpHash = await hashOtp(otp, this.getConfig().passwordPepper);
    user.deleteAccountOtpExpiry = new Date(
      now + StudioAuthService.DELETE_OTP_TTL_MS,
    );
    await user.save();

    await this.email.sendDeleteAccountOtp(user.email!, otp);

    return {
      message: 'A confirmation code was sent to your email.',
    };
  }

  async confirmDeleteAccount(
    ctx: StudioRequestContext,
    body: StudioConfirmDeleteAccountDto,
  ): Promise<StudioMessageData> {
    const user = await this.userModel.findById(ctx.userId).exec();
    if (!user?.deleteAccountOtpHash || !user.deleteAccountOtpExpiry) {
      throw new BadRequestException({
        errorCode: ErrorCode.INVALID_OTP,
        message: 'No deletion request in progress. Request a new code first.',
      });
    }

    if (user.deleteAccountOtpExpiry <= new Date()) {
      throw new BadRequestException({
        errorCode: ErrorCode.INVALID_OTP,
        message: 'Confirmation code expired. Request a new code.',
      });
    }

    const valid = await verifyOtp(
      body.otp.trim(),
      this.getConfig().passwordPepper,
      user.deleteAccountOtpHash,
    );
    if (!valid) {
      throw new BadRequestException({
        errorCode: ErrorCode.INVALID_OTP,
        message: 'Invalid confirmation code.',
      });
    }

    if (ctx.role === StudioRole.USER_EDITOR) {
      if (isSeatUser(user)) {
        throw new BadRequestException({
          errorCode: ErrorCode.SEAT_SELF_DELETE_BLOCKED,
          message:
            'Team seats cannot be self-deleted. Ask your workspace admin to remove your access.',
        });
      }
      await this.accountDelete.removeEditorMembership(
        ctx.userId,
        ctx.accountId,
      );
      return { message: 'Your account was deleted.' };
    }

    if (ctx.role === StudioRole.USER_ADMIN) {
      const members = await this.accountDelete.countAccountMembers(
        ctx.accountId,
      );
      if (members > 1) {
        throw new BadRequestException({
          errorCode: ErrorCode.DELETE_ACCOUNT_BLOCKED,
          message:
            'Remove all team members before deleting the account workspace.',
        });
      }
      await this.accountDelete.deleteEntireAccount(ctx.accountId);
      await this.userModel.findByIdAndDelete(ctx.userId);
      return {
        message: 'Your account and workspace were permanently deleted.',
      };
    }

    await this.userModel.findByIdAndDelete(ctx.userId);
    return { message: 'Your account was deleted.' };
  }

  getGoogleAuthUrl(origin?: string): { authUrl: string } {
    const cfg = this.getConfig();
    if (!cfg.googleClientId || !cfg.googleRedirectUri) {
      throw new BadRequestException({
        errorCode: ErrorCode.GOOGLE_NOT_CONFIGURED,
        message: 'Google sign-in is not configured',
      });
    }

    const state = JSON.stringify({
      origin: origin ?? cfg.studioAppUrl,
      ts: Date.now(),
    });

    const params = new URLSearchParams({
      client_id: cfg.googleClientId,
      redirect_uri: cfg.googleRedirectUri,
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return {
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  }

  async googleAuth(code: string, state?: string): Promise<StudioSessionData> {
    const cfg = this.getConfig();
    if (!cfg.googleClientId || !cfg.googleClientSecret || !cfg.googleRedirectUri) {
      throw new BadRequestException({
        errorCode: ErrorCode.GOOGLE_NOT_CONFIGURED,
        message: 'Google sign-in is not configured',
      });
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: cfg.googleClientId,
        client_secret: cfg.googleClientSecret,
        redirect_uri: cfg.googleRedirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const detail = await tokenRes.text().catch(() => '');
      this.logger.warn(
        `Google token exchange failed (${tokenRes.status}): ${detail.slice(0, 300)}`,
      );
      throw new StudioAuthException(
        ErrorCode.GOOGLE_AUTH_FAILED,
        'Failed to authenticate with Google',
      );
    }

    const tokens = (await tokenRes.json()) as { access_token: string };
    const profileRes = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    );

    if (!profileRes.ok) {
      throw new StudioAuthException(
        ErrorCode.GOOGLE_AUTH_FAILED,
        'Failed to load Google profile',
      );
    }

    const profile = (await profileRes.json()) as {
      id: string;
      email: string;
      name?: string;
      picture?: string;
    };

    const email = profile.email?.toLowerCase();
    if (!email) {
      throw new StudioAuthException(
        ErrorCode.GOOGLE_AUTH_FAILED,
        'Google account has no email',
      );
    }

    let user = await this.userModel.findOne({ googleId: profile.id }).exec();
    if (!user) {
      user = await this.userModel.findOne({ email }).exec();
    }

    if (user) {
      user.googleId = profile.id;
      user.picture = profile.picture;
      user.emailVerified = true;
      if (!user.displayName && profile.name) {
        user.displayName = profile.name;
      }
      await user.save();
      return this.buildSessionForUser(user);
    }

    const account = await this.accountModel.create({
      name: `${profile.name ?? email}'s workspace`,
    });
    user = await this.userModel.create({
      email,
      displayName: profile.name,
      googleId: profile.id,
      picture: profile.picture,
      emailVerified: true,
    });
    await this.membershipModel.create({
      userId: user._id,
      accountId: account._id,
      role: StudioRole.USER_ADMIN,
      permissions: [],
      projectIds: [],
    });

    await this.maybeStartFreeTrial(account._id.toString());

    return this.buildSessionForUser(user);
  }

  private async maybeStartFreeTrial(accountId: string): Promise<void> {
    try {
      await this.subscriptions.startFreeTrial(accountId, 'free');
    } catch (error) {
      this.logger.debug(
        `Skipped auto free trial for account ${accountId}`,
        error,
      );
    }
  }

  issueGoogleOAuthCode(session: StudioSessionData): string {
    const code = randomBytes(24).toString('hex');
    this.pendingGoogleOAuth.set(code, {
      session,
      expiresAt: Date.now() + StudioAuthService.GOOGLE_OAUTH_CODE_TTL_MS,
    });
    return code;
  }

  completeGoogleAuth(code: string): StudioSessionData {
    const trimmed = code.trim();
    const pending = trimmed ? this.pendingGoogleOAuth.get(trimmed) : undefined;

    if (!pending || pending.expiresAt < Date.now()) {
      if (trimmed) {
        this.pendingGoogleOAuth.delete(trimmed);
      }
      throw new StudioAuthException(
        ErrorCode.GOOGLE_AUTH_FAILED,
        'Google sign-in expired. Please try again.',
      );
    }

    return pending.session;
  }

  buildGoogleCallbackRedirect(
    success: boolean,
    oauthCode?: string,
    origin?: string,
  ): string {
    const base = origin ?? this.getConfig().studioAppUrl;
    if (success && oauthCode) {
      return buildStudioAppUrl(base, '/auth/callback', { code: oauthCode });
    }
    return buildStudioAppUrl(base, '/auth/callback', {
      error: 'google_auth_failed',
    });
  }

  async resolveContextFromToken(token: string): Promise<StudioRequestContext> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.getConfig().jwtSecret,
      });
    } catch {
      throw new StudioAuthException(
        ErrorCode.UNAUTHORIZED,
        'Invalid or expired session',
      );
    }

    const user = await this.userModel.findById(payload.sub).exec();
    if (!user || user.tokenVersion !== payload.tv) {
      throw new StudioAuthException(
        ErrorCode.UNAUTHORIZED,
        'Session is no longer valid',
      );
    }

    const membership = await this.membershipModel
      .findOne({
        userId: new Types.ObjectId(payload.sub),
        accountId: new Types.ObjectId(payload.aid),
      })
      .exec();
    if (!membership || membership.role !== payload.role) {
      throw new StudioAuthException(
        ErrorCode.UNAUTHORIZED,
        'Session is no longer valid',
      );
    }

    const permissions = resolveStudioPermissions(
      membership.role,
      membership.permissions,
    );

    return {
      userId: user._id.toString(),
      accountId: membership.accountId.toString(),
      email: user.email,
      username: membership.loginName,
      role: membership.role,
      permissions,
      projectIds: membership.projectIds ?? [],
    };
  }

  getMe(ctx: StudioRequestContext): Promise<StudioAuthMeData> {
    return this.loadMe(ctx.userId, ctx.accountId);
  }

  async updateProfile(
    ctx: StudioRequestContext,
    body: UpdateStudioProfileDto,
  ): Promise<StudioAuthMeData> {
    const user = await this.userModel.findById(ctx.userId).exec();
    if (!user) {
      throw new StudioAuthException(
        ErrorCode.USER_NOT_FOUND,
        'User not found',
      );
    }

    if (body.displayName !== undefined) {
      user.displayName = body.displayName.trim() || undefined;
    }
    if (body.picture !== undefined) {
      user.picture = body.picture.trim() || undefined;
    }
    await user.save();

    return this.loadMe(ctx.userId, ctx.accountId);
  }

  private async buildSessionForUser(
    user: StudioUserDocument,
  ): Promise<StudioSessionData> {
    const membership = await this.membershipModel
      .findOne({ userId: user._id })
      .exec();
    if (!membership) {
      throw new UnauthorizedException({
        errorCode: ErrorCode.UNAUTHORIZED,
        message: 'No account membership',
      });
    }

    const account = await this.accountModel.findById(membership.accountId).exec();
    if (!account) {
      throw new UnauthorizedException({
        errorCode: ErrorCode.UNAUTHORIZED,
        message: 'Account not found',
      });
    }

    const permissions = resolveStudioPermissions(
      membership.role,
      membership.permissions,
    );

    return this.buildSession(
      user,
      account,
      membership.role,
      permissions,
      membership.projectIds ?? [],
      membership,
    );
  }

  private async loadMe(
    userId: string,
    accountId: string,
  ): Promise<StudioAuthMeData> {
    const user = await this.userModel.findById(userId).exec();
    const account = await this.accountModel.findById(accountId).exec();
    const membership = await this.membershipModel
      .findOne({
        userId: new Types.ObjectId(userId),
        accountId: new Types.ObjectId(accountId),
      })
      .exec();

    if (!user || !account || !membership) {
      throw new StudioAuthException(
        ErrorCode.UNAUTHORIZED,
        'Session is no longer valid',
      );
    }

    const permissions = resolveStudioPermissions(
      membership.role,
      membership.permissions,
    );

    return {
      user: this.toUserData(user, membership),
      account: this.toAccountData(account),
      role: membership.role,
      permissions,
      projectIds: membership.projectIds ?? [],
    };
  }

  private async buildSession(
    user: StudioUserDocument,
    account: StudioAccountDocument,
    role: StudioRole,
    permissions: string[],
    projectIds: string[],
    membership?: StudioMembershipDocument,
  ): Promise<StudioSessionData> {
    const accessToken = await this.signAccessToken(
      user,
      account._id.toString(),
      role,
      user.tokenVersion,
    );
    const refreshToken = await this.jwt.signAsync(
      {
        sub: user._id.toString(),
        aid: account._id.toString(),
        role,
        tv: user.tokenVersion,
      } satisfies JwtPayload,
      {
        secret: this.getConfig().jwtRefreshSecret,
        expiresIn: this.getConfig().jwtRefreshExpiresIn as `${number}d`,
      },
    );

    return {
      accessToken,
      refreshToken,
      user: this.toUserData(user, membership),
      account: this.toAccountData(account),
      role,
      permissions,
      projectIds,
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
        secret: this.getConfig().jwtSecret,
        expiresIn: this.getConfig().jwtAccessExpiresIn as `${number}m`,
      },
    );
  }

  private toUserData(
    doc: StudioUserDocument,
    membership?: StudioMembershipDocument,
  ) {
    return {
      id: doc._id.toString(),
      email: doc.email,
      username: membership?.loginName,
      displayName: doc.displayName,
      emailVerified: doc.emailVerified,
      picture: doc.picture,
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
      updatedAt: (doc.updatedAt ?? new Date()).toISOString(),
    };
  }

  private toAccountData(doc: StudioAccountDocument) {
    return {
      id: doc._id.toString(),
      name: doc.name,
      billingEmail: doc.billingEmail,
      timezone: doc.timezone,
      defaultLocale: doc.defaultLocale,
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
      updatedAt: (doc.updatedAt ?? new Date()).toISOString(),
    };
  }

  private async maybeCreateDefaultProject(
    account: StudioAccountDocument,
    user: StudioUserDocument,
    membership: StudioMembershipDocument,
  ): Promise<string | undefined> {
    if (!this.getConfig().defaultProjectOnSignup) {
      return undefined;
    }

    const ctx: StudioRequestContext = {
      accountId: account._id.toString(),
      userId: user._id.toString(),
      email: user.email ?? '',
      role: StudioRole.USER_ADMIN,
      permissions: resolveStudioPermissions(StudioRole.USER_ADMIN, []),
      projectIds: [],
    };

    const project = await this.projects.create(ctx, {
      name: this.getConfig().defaultProjectName,
    });

    membership.projectIds = [project.id];
    await membership.save();

    return project.id;
  }

  private getConfig(): StudioAuthConfig {
    return this.config.getOrThrow<StudioAuthConfig>('studioAuth');
  }

  private logLoginFailure(
    mode: 'email' | 'seat',
    identifier: string,
    reason: string,
  ): void {
    this.logger.warn(
      `Studio auth login failed (${mode}): ${identifier} reason=${reason}`,
    );
  }
}
