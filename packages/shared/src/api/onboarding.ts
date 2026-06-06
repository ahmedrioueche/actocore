import { apiPath } from '../config/api-version';
import type { UpdateStudioOnboardingDto } from '../dtos/onboarding.dto';
import type { ApiResponse } from '../types/api-response';
import type { StudioOnboardingStateData } from '../types/onboarding';
import { BaseApi } from './helper';

/** Post-signup workspace setup wizard (`/v1/web/onboarding`). */
export class OnboardingApi extends BaseApi {
  getState(): Promise<ApiResponse<StudioOnboardingStateData>> {
    return this.request(() =>
      this.client.get<ApiResponse<StudioOnboardingStateData>>(
        apiPath('web/onboarding'),
      ),
    );
  }

  update(
    body: UpdateStudioOnboardingDto,
  ): Promise<ApiResponse<StudioOnboardingStateData>> {
    return this.request(() =>
      this.client.patch<ApiResponse<StudioOnboardingStateData>>(
        apiPath('web/onboarding'),
        body,
      ),
    );
  }
}

export const onboardingApi = new OnboardingApi();
