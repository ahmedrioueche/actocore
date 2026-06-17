import { apiPath } from '../config/api-version';
import type { UpdateStudioProductTourDto } from '../dtos/product-tour.dto';
import type { ApiResponse } from '../types/api-response';
import type { StudioProductTourStateData } from '../types/product-tour';
import { BaseApi } from './helper';

/** Per-user product tour coachmarks (`/v1/web/product-tour`). */
export class ProductTourApi extends BaseApi {
  getState(): Promise<ApiResponse<StudioProductTourStateData>> {
    return this.request(() =>
      this.client.get<ApiResponse<StudioProductTourStateData>>(
        apiPath('web/product-tour'),
      ),
    );
  }

  update(
    body: UpdateStudioProductTourDto,
  ): Promise<ApiResponse<StudioProductTourStateData>> {
    return this.request(() =>
      this.client.patch<ApiResponse<StudioProductTourStateData>>(
        apiPath('web/product-tour'),
        body,
      ),
    );
  }
}

export const productTourApi = new ProductTourApi();
