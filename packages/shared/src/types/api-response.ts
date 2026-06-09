/** Optional payload on plan-limit errors (`PROJECT_LIMIT_REACHED`, `SEAT_LIMIT_REACHED`, `ACTION_LIMIT_REACHED`). */
export interface PlanLimitErrorDetails {
  limit: number;
  used?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  errorCode?: string;
  data?: T;
  message?: string;
  details?: PlanLimitErrorDetails;
}
