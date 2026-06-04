import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { STUDIO_ROLE_KEY } from '../decorators/require-studio-role.decorator';
import type { StudioAuthenticatedRequest } from '../decorators/studio-context.decorator';

@Injectable()
export class StudioRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(STUDIO_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<StudioAuthenticatedRequest>();
    const studio = request.studio;
    if (!studio || !roles.includes(studio.role)) {
      throw new ForbiddenException({
        errorCode: ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: 'Insufficient role for this action',
      });
    }
    return true;
  }
}
