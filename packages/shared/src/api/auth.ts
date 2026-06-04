import { apiPath } from '../config/api-version';
import type {
  CreateStudioMemberDto,
  UpdateStudioMemberDto,
  StudioChangePasswordDto,
  StudioConfirmDeleteAccountDto,
  StudioForgotPasswordDto,
  StudioLoginDto,
  StudioRefreshDto,
  StudioResendVerificationDto,
  StudioResetPasswordDto,
  StudioSignupDto,
  StudioVerifyEmailDto,
} from '../dtos/studio-auth.dto';
import type { UpdateStudioProfileDto } from '../dtos/account.dto';
import type { ApiResponse } from '../types/api-response';
import type {
  StudioAuthMeData,
  StudioGoogleAuthUrlData,
  StudioMemberData,
  StudioTeamAuditEntryData,
  StudioMessageData,
  StudioRefreshResultData,
  StudioSessionData,
  StudioSignupResultData,
} from '../types/studio';
import { TokenManager } from './token';
import { BaseApi } from './helper';

function storeSession(data: StudioSessionData): void {
  TokenManager.setTokens(data.accessToken, data.refreshToken);
}

/** Studio dashboard auth (`/v1/web/auth/*`). */
export class StudioAuthApi extends BaseApi {
  signup(body: StudioSignupDto): Promise<ApiResponse<StudioSignupResultData>> {
    return this.request(() =>
      this.client.post<ApiResponse<StudioSignupResultData>>(
        apiPath('web/auth/signup'),
        body,
      ),
    );
  }

  login(body: StudioLoginDto): Promise<ApiResponse<StudioSessionData>> {
    return this.request(async () => {
      const res = await this.client.post<ApiResponse<StudioSessionData>>(
        apiPath('web/auth/login'),
        body,
      );
      if (res.data.success && res.data.data) {
        storeSession(res.data.data);
      }
      return res;
    });
  }

  verifyEmail(
    body: StudioVerifyEmailDto,
  ): Promise<ApiResponse<StudioSessionData>> {
    return this.request(async () => {
      const res = await this.client.post<ApiResponse<StudioSessionData>>(
        apiPath('web/auth/verify-email'),
        body,
      );
      if (res.data.success && res.data.data) {
        storeSession(res.data.data);
      }
      return res;
    });
  }

  resendVerification(
    body: StudioResendVerificationDto,
  ): Promise<ApiResponse<StudioMessageData>> {
    return this.request(() =>
      this.client.post<ApiResponse<StudioMessageData>>(
        apiPath('web/auth/resend-verification'),
        body,
      ),
    );
  }

  forgotPassword(
    body: StudioForgotPasswordDto,
  ): Promise<ApiResponse<StudioMessageData>> {
    return this.request(() =>
      this.client.post<ApiResponse<StudioMessageData>>(
        apiPath('web/auth/forgot-password'),
        body,
      ),
    );
  }

  resetPassword(
    body: StudioResetPasswordDto,
  ): Promise<ApiResponse<StudioMessageData>> {
    return this.request(() =>
      this.client.post<ApiResponse<StudioMessageData>>(
        apiPath('web/auth/reset-password'),
        body,
      ),
    );
  }

  refresh(body?: StudioRefreshDto): Promise<ApiResponse<StudioRefreshResultData>> {
    const refreshToken =
      body?.refreshToken ?? TokenManager.getRefreshToken() ?? undefined;
    return this.request(async () => {
      const res = await this.client.post<ApiResponse<StudioRefreshResultData>>(
        apiPath('web/auth/refresh'),
        { refreshToken },
      );
      if (res.data.success && res.data.data?.accessToken) {
        TokenManager.setAccessToken(res.data.data.accessToken);
      }
      return res;
    });
  }

  logout(): Promise<ApiResponse<StudioMessageData>> {
    return this.request(async () => {
      const res = await this.client.post<ApiResponse<StudioMessageData>>(
        apiPath('web/auth/logout'),
      );
      TokenManager.clearTokens();
      return res;
    });
  }

  me(): Promise<ApiResponse<StudioAuthMeData>> {
    return this.request(() =>
      this.client.get<ApiResponse<StudioAuthMeData>>(apiPath('web/auth/me')),
    );
  }

  updateProfile(
    body: UpdateStudioProfileDto,
  ): Promise<ApiResponse<StudioAuthMeData>> {
    return this.request(() =>
      this.client.patch<ApiResponse<StudioAuthMeData>>(
        apiPath('web/auth/me'),
        body,
      ),
    );
  }

  changePassword(
    body: StudioChangePasswordDto,
  ): Promise<ApiResponse<StudioMessageData>> {
    return this.request(() =>
      this.client.post<ApiResponse<StudioMessageData>>(
        apiPath('web/auth/change-password'),
        body,
      ),
    );
  }

  getGoogleAuthUrl(): Promise<ApiResponse<StudioGoogleAuthUrlData>> {
    return this.request(() =>
      this.client.get<ApiResponse<StudioGoogleAuthUrlData>>(
        apiPath('web/auth/google'),
      ),
    );
  }

  /** Browser redirect to Google OAuth. */
  redirectToGoogleAuth(): Promise<void> {
    return this.getGoogleAuthUrl().then((res) => {
      if (res.success && res.data?.authUrl && typeof window !== 'undefined') {
        window.location.href = res.data.authUrl;
      }
    });
  }

  listMembers(): Promise<ApiResponse<StudioMemberData[]>> {
    return this.request(() =>
      this.client.get<ApiResponse<StudioMemberData[]>>(
        apiPath('web/auth/members'),
      ),
    );
  }

  listTeamAudit(limit?: number): Promise<ApiResponse<StudioTeamAuditEntryData[]>> {
    const query = limit != null ? `?limit=${limit}` : '';
    return this.request(() =>
      this.client.get<ApiResponse<StudioTeamAuditEntryData[]>>(
        apiPath(`web/auth/members/audit${query}`),
      ),
    );
  }

  createMember(
    body: CreateStudioMemberDto,
  ): Promise<ApiResponse<StudioMemberData>> {
    return this.request(() =>
      this.client.post<ApiResponse<StudioMemberData>>(
        apiPath('web/auth/members'),
        body,
      ),
    );
  }

  updateMember(
    userId: string,
    body: UpdateStudioMemberDto,
  ): Promise<ApiResponse<StudioMemberData>> {
    return this.request(() =>
      this.client.patch<ApiResponse<StudioMemberData>>(
        apiPath(`web/auth/members/${userId}`),
        body,
      ),
    );
  }

  removeMember(userId: string): Promise<ApiResponse<StudioMessageData>> {
    return this.request(() =>
      this.client.delete<ApiResponse<StudioMessageData>>(
        apiPath(`web/auth/members/${userId}`),
      ),
    );
  }

  requestDeleteAccountOtp(): Promise<ApiResponse<StudioMessageData>> {
    return this.request(() =>
      this.client.post<ApiResponse<StudioMessageData>>(
        apiPath('web/auth/delete-account/request-otp'),
      ),
    );
  }

  confirmDeleteAccount(
    body: StudioConfirmDeleteAccountDto,
  ): Promise<ApiResponse<StudioMessageData>> {
    return this.request(async () => {
      const res = await this.client.post<ApiResponse<StudioMessageData>>(
        apiPath('web/auth/delete-account/confirm'),
        body,
      );
      if (res.data.success) {
        TokenManager.clearTokens();
      }
      return res;
    });
  }
}

export const authApi = new StudioAuthApi();
export const studioAuthApi = authApi;
