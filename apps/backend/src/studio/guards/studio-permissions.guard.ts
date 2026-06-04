import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode, hasStudioPermission } from '@ahmedrioueche/actocore-shared';
import { STUDIO_PERMISSION_KEY } from '../decorators/require-studio-permission.decorator';
import type { StudioAuthenticatedRequest } from '../decorators/studio-context.decorator';

@Injectable()
export class StudioPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      STUDIO_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<StudioAuthenticatedRequest>();
    const studio = request.studio;
    if (!studio) {
      return true;
    }

    const missing = required.filter(
      (p) => !hasStudioPermission(studio.permissions, p),
    );
    if (missing.length > 0) {
      throw new ForbiddenException({
        errorCode: ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: `Missing permission: ${missing.join(', ')}`,
      });
    }

    return true;
  }
}
