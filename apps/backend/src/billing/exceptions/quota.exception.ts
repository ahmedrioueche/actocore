import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { quotaUserMessage } from '../quota-messages.util';

export type QuotaLimitWindow = 'monthly' | 'day' | 'minute';

export class QuotaExceededException extends HttpException {
  constructor(params: {
    window: QuotaLimitWindow;
    /** Internal / log message */
    message: string;
    userMessage?: string;
  }) {
    const userMessage = params.userMessage ?? quotaUserMessage(params.window);
    super(
      {
        errorCode: ErrorCode.QUOTA_EXCEEDED,
        message: userMessage,
        quotaWindow: params.window,
        detail: params.message,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
