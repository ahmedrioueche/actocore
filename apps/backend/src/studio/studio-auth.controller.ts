import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  apiSuccess,
  CreateStudioMemberDto,
  UpdateStudioMemberDto,
  UpdateStudioProfileDto,
  StudioChangePasswordDto,
  StudioConfirmDeleteAccountDto,
  StudioForgotPasswordDto,
  StudioLoginDto,
  StudioPermission,
  StudioRefreshDto,
  StudioResendVerificationDto,
  StudioResetPasswordDto,
  StudioSignupDto,
  StudioVerifyEmailDto,
} from '@ahmedrioueche/actocore-shared';
import type { Request, Response } from 'express';
import { StudioPublic } from './decorators/studio-public.decorator';
import { RequireStudioPermission } from './decorators/require-studio-permission.decorator';
import { StudioCtx } from './decorators/studio-context.decorator';
import { StudioAuthGuard } from './guards/studio-auth.guard';
import { StudioPermissionsGuard } from './guards/studio-permissions.guard';
import { StudioAuthService } from './studio-auth.service';
import { StudioMembersService } from './studio-members.service';
import type { StudioAuthConfig } from '../config/studio-auth.config';
import type { StudioRequestContext } from './studio-context';
import { parseAllowedOrigin } from './utils/studio-redirect.util';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';

@Controller('web/auth')
@UseGuards(StudioAuthGuard, StudioPermissionsGuard)
export class StudioAuthController {
  constructor(
    private readonly auth: StudioAuthService,
    private readonly members: StudioMembersService,
    private readonly config: ConfigService,
  ) {}

  @StudioPublic()
  @Post('signup')
  async signup(@Body() body: StudioSignupDto) {
    return apiSuccess(await this.auth.signup(body));
  }

  @StudioPublic()
  @Post('login')
  async login(@Body() body: StudioLoginDto) {
    return apiSuccess(await this.auth.login(body));
  }

  @StudioPublic()
  @Post('verify-email')
  async verifyEmail(@Body() body: StudioVerifyEmailDto) {
    return apiSuccess(await this.auth.verifyEmail(body));
  }

  @StudioPublic()
  @Post('resend-verification')
  async resendVerification(@Body() body: StudioResendVerificationDto) {
    return apiSuccess(await this.auth.resendVerification(body));
  }

  @StudioPublic()
  @Post('forgot-password')
  async forgotPassword(@Body() body: StudioForgotPasswordDto) {
    return apiSuccess(await this.auth.forgotPassword(body));
  }

  @StudioPublic()
  @Post('reset-password')
  async resetPassword(@Body() body: StudioResetPasswordDto) {
    return apiSuccess(await this.auth.resetPassword(body));
  }

  @StudioPublic()
  @Post('refresh')
  async refresh(@Body() body: StudioRefreshDto) {
    if (!body.refreshToken) {
      throw new UnauthorizedException({
        errorCode: ErrorCode.INVALID_REFRESH_TOKEN,
        message: 'Refresh token required',
      });
    }
    return apiSuccess(await this.auth.refresh(body.refreshToken));
  }

  @Post('logout')
  async logout(@StudioCtx() ctx: StudioRequestContext) {
    return apiSuccess(await this.auth.logout(ctx));
  }

  @Get('me')
  async me(@StudioCtx() ctx: StudioRequestContext) {
    return apiSuccess(await this.auth.getMe(ctx));
  }

  @Patch('me')
  async updateMe(
    @StudioCtx() ctx: StudioRequestContext,
    @Body() body: UpdateStudioProfileDto,
  ) {
    return apiSuccess(await this.auth.updateProfile(ctx, body));
  }

  @Post('change-password')
  async changePassword(
    @StudioCtx() ctx: StudioRequestContext,
    @Body() body: StudioChangePasswordDto,
  ) {
    return apiSuccess(await this.auth.changePassword(ctx, body));
  }

  @Post('delete-account/request-otp')
  async requestDeleteAccountOtp(@StudioCtx() ctx: StudioRequestContext) {
    return apiSuccess(await this.auth.requestDeleteAccountOtp(ctx));
  }

  @Post('delete-account/confirm')
  async confirmDeleteAccount(
    @StudioCtx() ctx: StudioRequestContext,
    @Body() body: StudioConfirmDeleteAccountDto,
  ) {
    return apiSuccess(await this.auth.confirmDeleteAccount(ctx, body));
  }

  @StudioPublic()
  @Get('google')
  async googleAuth(@Req() req: Request) {
    const cfg = this.config.getOrThrow<StudioAuthConfig>('studioAuth');
    const allowed = [cfg.studioAppUrl];
    const origin = parseAllowedOrigin(
      (req.headers.origin ?? req.headers.referer) as string | undefined,
      allowed,
    );
    return apiSuccess(this.auth.getGoogleAuthUrl(origin));
  }

  @StudioPublic()
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    let origin: string | undefined;
    try {
      const parsed = JSON.parse(state || '{}') as { origin?: string };
      origin = parsed.origin;
    } catch {
      origin = undefined;
    }

    try {
      const session = await this.auth.googleAuth(code);
      const url = this.auth.buildGoogleCallbackRedirect(
        true,
        {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        },
        origin,
      );
      res.redirect(url);
    } catch {
      res.redirect(this.auth.buildGoogleCallbackRedirect(false, undefined, origin));
    }
  }

  @Get('members/audit')
  @RequireStudioPermission(StudioPermission.TEAM_WRITE)
  async listTeamAudit(
    @StudioCtx() ctx: StudioRequestContext,
    @Query('limit') limit?: string,
  ) {
    StudioMembersService.assertTeamWrite(ctx);
    const parsed = limit ? parseInt(limit, 10) : 50;
    return apiSuccess(
      await this.members.listAudit(
        ctx,
        Number.isFinite(parsed) ? parsed : 50,
      ),
    );
  }

  @Get('members')
  @RequireStudioPermission(StudioPermission.TEAM_WRITE)
  async listMembers(@StudioCtx() ctx: StudioRequestContext) {
    StudioMembersService.assertTeamWrite(ctx);
    return apiSuccess(await this.members.list(ctx));
  }

  @Post('members')
  @RequireStudioPermission(StudioPermission.TEAM_WRITE)
  async createMember(
    @StudioCtx() ctx: StudioRequestContext,
    @Body() body: CreateStudioMemberDto,
  ) {
    StudioMembersService.assertTeamWrite(ctx);
    return apiSuccess(await this.members.createEditor(ctx, body));
  }

  @Patch('members/:userId')
  @RequireStudioPermission(StudioPermission.TEAM_WRITE)
  async updateMember(
    @StudioCtx() ctx: StudioRequestContext,
    @Param('userId') userId: string,
    @Body() body: UpdateStudioMemberDto,
  ) {
    StudioMembersService.assertTeamWrite(ctx);
    return apiSuccess(await this.members.updateEditor(ctx, userId, body));
  }

  @Delete('members/:userId')
  @RequireStudioPermission(StudioPermission.TEAM_WRITE)
  async removeMember(
    @StudioCtx() ctx: StudioRequestContext,
    @Param('userId') userId: string,
  ) {
    StudioMembersService.assertTeamWrite(ctx);
    return apiSuccess(await this.members.removeEditor(ctx, userId));
  }
}
