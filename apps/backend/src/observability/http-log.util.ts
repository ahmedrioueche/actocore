import { HttpException } from '@nestjs/common';
import type { ErrorCode } from '@ahmedrioueche/actocore-shared';

export function resolveHttpErrorStatus(error: unknown): number {
  if (error instanceof HttpException) {
    return error.getStatus();
  }
  return 500;
}

export function resolveHttpErrorCode(error: unknown): ErrorCode | undefined {
  if (!(error instanceof HttpException)) {
    return undefined;
  }
  const body = error.getResponse();
  if (
    typeof body === 'object' &&
    body !== null &&
    'errorCode' in body &&
    typeof body.errorCode === 'string'
  ) {
    return body.errorCode as ErrorCode;
  }
  return undefined;
}

export function formatHttpLogLine(input: {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  projectId?: string;
  errorCode?: string;
}): string {
  const project = input.projectId ?? '-';
  const errorSuffix = input.errorCode ? ` error=${input.errorCode}` : '';
  return `${input.method} ${input.path} ${input.status} ${input.durationMs}ms project=${project}${errorSuffix}`;
}
