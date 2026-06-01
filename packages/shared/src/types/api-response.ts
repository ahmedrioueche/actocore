export interface ApiResponse<T = unknown> {
  success: boolean;
  errorCode?: string;
  data?: T;
  message?: string;
}
