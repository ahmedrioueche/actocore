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
  PaddleCheckoutData,
  PaddleTransactionStatusData,
  StudioCustomerPortalData,
  StudioPlan,
  StudioBillingHistoryEntry,
  StudioSubscription,
  StudioSubscriptionSummary,
  StudioTrialEligibility,
  StudioUpgradePreviewData,
} from '../types/billing';
import type { AccountQuotaStatusData } from '../types/usage';
import { BaseApi } from './helper';

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

  listPaymentHistory(): Promise<ApiResponse<StudioBillingHistoryEntry[]>> {
    return this.request(() =>
      this.client.get<ApiResponse<StudioBillingHistoryEntry[]>>(
        apiPath('web/billing/payments'),
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
  ): Promise<ApiResponse<PaddleCheckoutData>> {
    return this.request(() =>
      this.client.post<ApiResponse<PaddleCheckoutData>>(
        apiPath('web/billing/paddle/checkout'),
        body,
      ),
    );
  }

  getTransactionStatus(
    transactionId: string,
  ): Promise<ApiResponse<PaddleTransactionStatusData>> {
    return this.request(() =>
      this.client.get<ApiResponse<PaddleTransactionStatusData>>(
        apiPath(`web/billing/paddle/transaction/${transactionId}`),
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
  ): Promise<ApiResponse<StudioSubscription>> {
    return this.request(() =>
      this.client.post<ApiResponse<StudioSubscription>>(
        apiPath('web/billing/subscription/upgrade'),
        body,
      ),
    );
  }

  createCustomerPortal(): Promise<ApiResponse<StudioCustomerPortalData>> {
    return this.request(() =>
      this.client.post<ApiResponse<StudioCustomerPortalData>>(
        apiPath('web/billing/paddle/customer-portal'),
      ),
    );
  }
}

/** Super-admin plan catalog — `/v1/web/admin/plans/*` */
export class StudioPlansAdminApi extends BaseApi {
  list(includeInactive?: boolean): Promise<ApiResponse<StudioPlan[]>> {
    return this.request(() =>
      this.client.get<ApiResponse<StudioPlan[]>>(apiPath('web/admin/plans'), {
        params: includeInactive ? { includeInactive: 'true' } : undefined,
      }),
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
