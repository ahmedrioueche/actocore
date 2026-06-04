import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '@ahmedrioueche/actocore-shared';

export class StudioAuthException extends HttpException {
  constructor(errorCode: ErrorCode, message: string, status = HttpStatus.UNAUTHORIZED) {
    super({ errorCode, message }, status);
  }
}
