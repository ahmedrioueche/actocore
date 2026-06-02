import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';

export class QuotaExceededException extends HttpException {
  constructor(message: string) {
    super(
      { errorCode: ErrorCode.TOO_MANY_REQUESTS, message },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
