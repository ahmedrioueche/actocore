import { apiPath } from '../config/api-version';
import type {
  UpdateStudioAccountDto,
  UpdateStudioAccountPreferencesDto,
} from '../dtos/account.dto';
import type { ApiResponse } from '../types/api-response';
import type {
  StudioAccountPreferences,
  StudioAccountSettingsData,
} from '../types/account';
import { BaseApi } from './helper';

/** Tenant workspace settings (`/v1/web/account/*`). */
export class AccountApi extends BaseApi {
  getAccount(): Promise<ApiResponse<StudioAccountSettingsData>> {
    return this.request(() =>
      this.client.get<ApiResponse<StudioAccountSettingsData>>(
        apiPath('web/account'),
      ),
    );
  }

  updateAccount(
    body: UpdateStudioAccountDto,
  ): Promise<ApiResponse<StudioAccountSettingsData>> {
    return this.request(() =>
      this.client.patch<ApiResponse<StudioAccountSettingsData>>(
        apiPath('web/account'),
        body,
      ),
    );
  }

  getPreferences(): Promise<ApiResponse<StudioAccountPreferences>> {
    return this.request(() =>
      this.client.get<ApiResponse<StudioAccountPreferences>>(
        apiPath('web/account/preferences'),
      ),
    );
  }

  updatePreferences(
    body: UpdateStudioAccountPreferencesDto,
  ): Promise<ApiResponse<StudioAccountPreferences>> {
    return this.request(() =>
      this.client.patch<ApiResponse<StudioAccountPreferences>>(
        apiPath('web/account/preferences'),
        body,
      ),
    );
  }
}

export const accountApi = new AccountApi();
