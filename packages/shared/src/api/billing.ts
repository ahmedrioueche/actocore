import { apiPath } from '../config/api-version';
import type {
  CancelSubscriptionDto,
  CreateStudioPlanDto,
  CreateSubscriptionCheckoutDto,
  ScheduleDowngradeDto,
  StartFreeTrialDto,
  UpdateStudioPlanDto,
  UpgradeSubscriptionDto,
} from '../dtos/billing.dto';
import type { ApiResponse } from '../types/api-response';
import type {
  PayPalCheckoutData,
  PayPalSubscriptionStatusData,
  StudioPayPalManageUrlData,
  StudioPlan,
  StudioBillingHistoryEntry,
  StudioSubscription,
  StudioSubscriptionSummary,
  StudioTrialEligibility,
  StudioUpgradePreviewData,
  StudioUpgradeResult,
} from '../types/billing';
import type { AccountQuotaStatusData } from '../types/usage';
import type { Paginated, PaginationQuery } from '../types/pagination';
import { BaseApi } from './helper';

function paginationParams(query: PaginationQuery): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.page != null) {
    params.page = String(query.page);
  }
  if (query.limit != null) {
    params.limit = String(query.limit);
  }
  return params;
}

/** Tenant billing (user admin) — `/v1/web/billing/*` */
export class StudioBillingApi extends BaseApi {
  listPlans(): Promise<ApiResponse<StudioPlan[]>> {
    return this.request(() =>
      this.client.get<ApiResponse<StudioPlan[]>>(apiPath('web/billing/plans')),
    );
  }

  getSubscription(): Promise<ApiResponse<StudioSubscriptionSummary>> {
    return this.request(() =>
      this.client.get<ApiResponse<StudioSubscriptionSummary>>(
        apiPath('web/billing/subscription'),
      ),
    );
  }

  getQuota(): Promise<ApiResponse<AccountQuotaStatusData>> {
    return this.request(() =>
      this.client.get<ApiResponse<AccountQuotaStatusData>>(
        apiPath('web/billing/quota'),
      ),
    );
  }

  listPaymentHistory(
    query: PaginationQuery = {},
  ): Promise<ApiResponse<Paginated<StudioBillingHistoryEntry>>> {
    return this.request(() =>
      this.client.get<ApiResponse<Paginated<StudioBillingHistoryEntry>>>(
        apiPath('web/billing/payments'),
        { params: paginationParams(query) },
      ),
    );
  }

  getTrialEligibility(
    planId: string,
  ): Promise<ApiResponse<StudioTrialEligibility>> {
    return this.request(() =>
      this.client.get<ApiResponse<StudioTrialEligibility>>(
        apiPath('web/billing/trial/eligibility'),
        { params: { planId } },
      ),
    );
  }

  startFreeTrial(
    body: StartFreeTrialDto,
  ): Promise<ApiResponse<StudioSubscription>> {
    return this.request(() =>
      this.client.post<ApiResponse<StudioSubscription>>(
        apiPath('web/billing/trial/start'),
        body,
      ),
    );
  }

  createCheckout(
    body: CreateSubscriptionCheckoutDto,
  ): Promise<ApiResponse<PayPalCheckoutData>> {
    return this.request(() =>
      this.client.post<ApiResponse<PayPalCheckoutData>>(
        apiPath('web/billing/paypal/checkout'),
        body,
      ),
    );
  }

  getSubscriptionStatus(
    subscriptionId: string,
  ): Promise<ApiResponse<PayPalSubscriptionStatusData>> {
    return this.request(() =>
      this.client.get<ApiResponse<PayPalSubscriptionStatusData>>(
        apiPath(`web/billing/paypal/subscription/${subscriptionId}`),
      ),
    );
  }

  getPayPalManageUrl(): Promise<ApiResponse<StudioPayPalManageUrlData>> {
    return this.request(() =>
      this.client.get<ApiResponse<StudioPayPalManageUrlData>>(
        apiPath('web/billing/paypal/manage-url'),
      ),
    );
  }

  cancelSubscription(
    body?: CancelSubscriptionDto,
  ): Promise<ApiResponse<StudioSubscription>> {
    return this.request(() =>
      this.client.post<ApiResponse<StudioSubscription>>(
        apiPath('web/billing/subscription/cancel'),
        body ?? {},
      ),
    );
  }

  reactivateSubscription(): Promise<ApiResponse<StudioSubscription>> {
    return this.request(() =>
      this.client.post<ApiResponse<StudioSubscription>>(
        apiPath('web/billing/subscription/reactivate'),
      ),
    );
  }

  scheduleDowngrade(
    body: ScheduleDowngradeDto,
  ): Promise<ApiResponse<StudioSubscription>> {
    return this.request(() =>
      this.client.post<ApiResponse<StudioSubscription>>(
        apiPath('web/billing/subscription/downgrade'),
        body,
      ),
    );
  }

  cancelPendingChange(): Promise<ApiResponse<StudioSubscription>> {
    return this.request(() =>
      this.client.post<ApiResponse<StudioSubscription>>(
        apiPath('web/billing/subscription/cancel-pending-change'),
      ),
    );
  }

  previewUpgrade(
    body: UpgradeSubscriptionDto,
  ): Promise<ApiResponse<StudioUpgradePreviewData>> {
    return this.request(() =>
      this.client.post<ApiResponse<StudioUpgradePreviewData>>(
        apiPath('web/billing/subscription/upgrade/preview'),
        body,
      ),
    );
  }

  applyUpgrade(
    body: UpgradeSubscriptionDto,
  ): Promise<ApiResponse<StudioUpgradeResult>> {
    return this.request(() =>
      this.client.post<ApiResponse<StudioUpgradeResult>>(
        apiPath('web/billing/subscription/upgrade'),
        body,
      ),
    );
  }
}

/** Super-admin plan catalog — `/v1/web/admin/plans/*` */
export class StudioPlansAdminApi extends BaseApi {
  list(
    includeInactive?: boolean,
    query: PaginationQuery = {},
  ): Promise<ApiResponse<Paginated<StudioPlan>>> {
    return this.request(() =>
      this.client.get<ApiResponse<Paginated<StudioPlan>>>(
        apiPath('web/admin/plans'),
        {
          params: {
            ...paginationParams(query),
            ...(includeInactive ? { includeInactive: 'true' } : {}),
          },
        },
      ),
    );
  }

  get(id: string): Promise<ApiResponse<StudioPlan>> {
    return this.request(() =>
      this.client.get<ApiResponse<StudioPlan>>(apiPath(`web/admin/plans/${id}`)),
    );
  }

  create(body: CreateStudioPlanDto): Promise<ApiResponse<StudioPlan>> {
    return this.request(() =>
      this.client.post<ApiResponse<StudioPlan>>(
        apiPath('web/admin/plans'),
        body,
      ),
    );
  }

  update(id: string, body: UpdateStudioPlanDto): Promise<ApiResponse<StudioPlan>> {
    return this.request(() =>
      this.client.patch<ApiResponse<StudioPlan>>(
        apiPath(`web/admin/plans/${id}`),
        body,
      ),
    );
  }

  remove(id: string): Promise<ApiResponse<{ message: string; planId: string }>> {
    return this.request(() =>
      this.client.delete<ApiResponse<{ message: string; planId: string }>>(
        apiPath(`web/admin/plans/${id}`),
      ),
    );
  }
}

export const billingApi = new StudioBillingApi();
export const plansAdminApi = new StudioPlansAdminApi();
