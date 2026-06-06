import { UnauthorizedException } from '@nestjs/common';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import {
  formatHttpLogLine,
  resolveHttpErrorCode,
  resolveHttpErrorStatus,
} from './http-log.util';

describe('http-log.util', () => {
  it('formats lines with optional error code', () => {
    expect(
      formatHttpLogLine({
        method: 'POST',
        path: '/v1/web/auth/login',
        status: 401,
        durationMs: 93,
        errorCode: ErrorCode.INVALID_CREDENTIALS,
      }),
    ).toBe(
      'POST /v1/web/auth/login 401 93ms project=- error=INVALID_CREDENTIALS',
    );
  });

  it('resolves status and error code from HttpException', () => {
    const error = new UnauthorizedException({
      errorCode: ErrorCode.EMAIL_NOT_VERIFIED,
      message: 'Please verify your email before signing in',
    });
    expect(resolveHttpErrorStatus(error)).toBe(401);
    expect(resolveHttpErrorCode(error)).toBe(ErrorCode.EMAIL_NOT_VERIFIED);
  });
});
