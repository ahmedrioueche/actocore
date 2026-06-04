import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { StudioRequestContext } from '../studio-context';

export type StudioAuthenticatedRequest = Request & {
  studio?: StudioRequestContext;
};

export const StudioCtx = createParamDecorator(
  (
    mode: 'optional' | undefined,
    ctx: ExecutionContext,
  ): StudioRequestContext | null => {
    const request = ctx.switchToHttp().getRequest<StudioAuthenticatedRequest>();
    if (!request.studio) {
      if (mode === 'optional') {
        return null;
      }
      throw new Error('StudioCtx requires StudioAuthGuard');
    }
    return request.studio;
  },
);
