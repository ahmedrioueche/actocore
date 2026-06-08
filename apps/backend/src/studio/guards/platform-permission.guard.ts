import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ErrorCode,
  hasPlatformPermission,
  StudioRole,
  type PlatformPermission,
} from '@ahmedrioueche/actocore-shared';
import { PLATFORM_PERMISSION_KEY } from '../decorators/require-platform-permission.decorator';
import type { StudioAuthenticatedRequest } from '../decorators/studio-context.decorator';
import { StudioPlatformBootstrapService } from '../studio-platform-bootstrap.service';
import { StudioPlatformAccessService } from '../studio-platform-access.service';

@Injectable()
export class PlatformPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly bootstrap: StudioPlatformBootstrapService,
    private readonly platformAccess: StudioPlatformAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<PlatformPermission[]>(
      PLATFORM_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<StudioAuthenticatedRequest>();
    const studio = request.studio;
    const platformAccountId = await this.bootstrap.getPlatformAccountIdReady();

    if (
      !studio ||
      !platformAccountId ||
      studio.accountId !== platformAccountId ||
      studio.role !== StudioRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException({
        errorCode: ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: 'Platform operator access required',
      });
    }

    if (await this.platformAccess.isMasterUser(studio.userId)) {
      return true;
    }

    const platformPermissions = await this.platformAccess.resolvePermissionsForUser(
      studio.userId,
    );
    if (!platformPermissions) {
      throw new ForbiddenException({
        errorCode: ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: 'Platform operator access required',
      });
    }

    const allowed = required.every((perm) =>
      hasPlatformPermission(platformPermissions, perm),
    );
    if (!allowed) {
      throw new ForbiddenException({
        errorCode: ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: 'Insufficient platform permission for this action',
      });
    }

    return true;
  }
}
