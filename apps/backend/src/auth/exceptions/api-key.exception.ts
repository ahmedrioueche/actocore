import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '@ahmedrioueche/actocore-shared';

export class ApiKeyException extends HttpException {
  constructor(errorCode: ErrorCode, message: string) {
    super({ errorCode, message }, HttpStatus.UNAUTHORIZED);
  }
}
