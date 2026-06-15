import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../../../auth/guards/api-key.guard';
import type { PlaygroundTokenPayload } from './playground-token.util';

export const PlaygroundCtx = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PlaygroundTokenPayload => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.playgroundToken) {
      throw new Error('PlaygroundGuard must run before PlaygroundCtx');
    }
    return request.playgroundToken;
  },
);
