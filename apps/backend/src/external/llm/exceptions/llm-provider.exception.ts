import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';

export class LlmProviderException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.BAD_GATEWAY,
    errorCode: ErrorCode = ErrorCode.BAD_GATEWAY,
  ) {
    super({ errorCode, message }, status);
  }

  static timeout(): LlmProviderException {
    return new LlmProviderException(
      'LLM provider request timed out',
      HttpStatus.GATEWAY_TIMEOUT,
      ErrorCode.GATEWAY_TIMEOUT,
    );
  }

  static upstream(message: string): LlmProviderException {
    return new LlmProviderException(message);
  }
}
