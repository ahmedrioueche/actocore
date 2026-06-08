import { apiPath } from '../config/api-version';
import type {
  PlatformChangePasswordDto,
  PlatformLoginDto,
  PlatformRefreshDto,
  UpdatePlatformManagerDto,
  CreatePlatformManagerDto,
} from '../dtos/platform-auth.dto';
import type { UpdateStudioProfileDto } from '../dtos/account.dto';
import type { ApiResponse } from '../types/api-response';
import type {
  PlatformAuthMeData,
  PlatformManagerData,
  PlatformSessionData,
} from '../types/platform';
import type { StudioMessageData, StudioRefreshResultData } from '../types/studio';
import { TokenManager } from './token';
import { BaseApi } from './helper';

function storePlatformSession(data: PlatformSessionData): void {
  TokenManager.setTokens(data.accessToken, data.refreshToken);
}

export class PlatformAuthApi extends BaseApi {
  login(body: PlatformLoginDto): Promise<ApiResponse<PlatformSessionData>> {
    return this.request(async () => {
      const res = await this.client.post<ApiResponse<PlatformSessionData>>(
        apiPath('web/platform/auth/login'),
        body,
      );
      if (res.data.success && res.data.data) {
        storePlatformSession(res.data.data);
      }
      return res;
    });
  }

  refresh(
    body?: PlatformRefreshDto,
  ): Promise<ApiResponse<StudioRefreshResultData>> {
    const refreshToken = body?.refreshToken ?? TokenManager.getRefreshToken();
    return this.request(async () => {
      const res = await this.client.post<ApiResponse<StudioRefreshResultData>>(
        apiPath('web/platform/auth/refresh'),
        { refreshToken },
      );
      if (res.data.success && res.data.data?.accessToken) {
        TokenManager.setAccessToken(res.data.data.accessToken);
      }
      return res;
    });
  }

  me(): Promise<ApiResponse<PlatformAuthMeData>> {
    return this.request(() =>
      this.client.get<ApiResponse<PlatformAuthMeData>>(
        apiPath('web/platform/auth/me'),
      ),
    );
  }

  updateProfile(
    body: UpdateStudioProfileDto,
  ): Promise<ApiResponse<PlatformAuthMeData>> {
    return this.request(() =>
      this.client.patch<ApiResponse<PlatformAuthMeData>>(
        apiPath('web/platform/auth/me'),
        body,
      ),
    );
  }

  changePassword(
    body: PlatformChangePasswordDto,
  ): Promise<ApiResponse<StudioMessageData>> {
    return this.request(() =>
      this.client.post<ApiResponse<StudioMessageData>>(
        apiPath('web/platform/auth/change-password'),
        body,
      ),
    );
  }

  listManagers(): Promise<ApiResponse<PlatformManagerData[]>> {
    return this.request(() =>
      this.client.get<ApiResponse<PlatformManagerData[]>>(
        apiPath('web/platform/managers'),
      ),
    );
  }

  createManager(
    body: CreatePlatformManagerDto,
  ): Promise<ApiResponse<PlatformManagerData>> {
    return this.request(() =>
      this.client.post<ApiResponse<PlatformManagerData>>(
        apiPath('web/platform/managers'),
        body,
      ),
    );
  }

  updateManager(
    userId: string,
    body: UpdatePlatformManagerDto,
  ): Promise<ApiResponse<PlatformManagerData>> {
    return this.request(() =>
      this.client.patch<ApiResponse<PlatformManagerData>>(
        apiPath(`web/platform/managers/${userId}`),
        body,
      ),
    );
  }

  deleteManager(userId: string): Promise<ApiResponse<StudioMessageData>> {
    return this.request(() =>
      this.client.delete<ApiResponse<StudioMessageData>>(
        apiPath(`web/platform/managers/${userId}`),
      ),
    );
  }
}

export const platformAuthApi = new PlatformAuthApi();
