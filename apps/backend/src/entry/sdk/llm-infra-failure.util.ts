import { HttpException } from '@nestjs/common';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { LlmProviderException } from '../../external/llm/exceptions/llm-provider.exception';

const LLM_INFRA_ERROR_CODES = new Set<ErrorCode>([
  ErrorCode.BAD_GATEWAY,
  ErrorCode.GATEWAY_TIMEOUT,
  ErrorCode.INTERNAL_ERROR,
]);

export function isLlmInfraFailure(error: unknown): boolean {
  if (!(error instanceof HttpException)) {
    return false;
  }

  const response = error.getResponse();
  if (typeof response !== 'object' || response === null) {
    return false;
  }

  const errorCode = (response as { errorCode?: ErrorCode }).errorCode;
  if (errorCode === ErrorCode.QUOTA_EXCEEDED) {
    return false;
  }

  return (
    error instanceof LlmProviderException ||
    (errorCode != null && LLM_INFRA_ERROR_CODES.has(errorCode))
  );
}
