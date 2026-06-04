import { ForbiddenException, Injectable } from '@nestjs/common';
import { ErrorCode, StudioRole } from '@ahmedrioueche/actocore-shared';
import { Types } from 'mongoose';
import type { StudioRequestContext } from './studio-context';

@Injectable()
export class StudioAccessService {
  canAccessProject(ctx: StudioRequestContext, projectId: string): boolean {
    if (
      ctx.role === StudioRole.SUPER_ADMIN ||
      ctx.role === StudioRole.USER_ADMIN
    ) {
      return true;
    }
    return ctx.projectIds.includes(projectId);
  }

  assertProjectAccess(ctx: StudioRequestContext, projectId: string): void {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new ForbiddenException({
        errorCode: ErrorCode.FORBIDDEN,
        message: 'Access denied',
      });
    }
    if (!this.canAccessProject(ctx, projectId)) {
      throw new ForbiddenException({
        errorCode: ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: 'You do not have access to this project',
      });
    }
  }

  accountFilter(ctx: StudioRequestContext): { accountId?: string } {
    if (ctx.role === StudioRole.SUPER_ADMIN) {
      return {};
    }
    return { accountId: ctx.accountId };
  }

  projectIdFilter(ctx: StudioRequestContext): { _id?: { $in: string[] } } | Record<string, never> {
    if (
      ctx.role === StudioRole.SUPER_ADMIN ||
      ctx.role === StudioRole.USER_ADMIN
    ) {
      return {};
    }
    if (ctx.projectIds.length === 0) {
      return { _id: { $in: [] } };
    }
    return { _id: { $in: ctx.projectIds } };
  }
}
