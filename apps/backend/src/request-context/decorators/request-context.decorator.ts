import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestContextData } from '@ahmedrioueche/actocore-shared';
import type { AuthenticatedRequest } from '../../auth/guards/api-key.guard';

export const RequestContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestContextData => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.actocore?.context) {
      throw new Error(
        'RequestContext decorator requires RequestContextInterceptor on SDK routes',
      );
    }
    return request.actocore.context;
  },
);
