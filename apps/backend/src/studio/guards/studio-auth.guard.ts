import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import type { StudioAuthConfig } from '../../config/studio-auth.config';
import { STUDIO_PUBLIC_KEY } from '../decorators/studio-public.decorator';
import type { StudioAuthenticatedRequest } from '../decorators/studio-context.decorator';
import { StudioAuthService } from '../studio-auth.service';

function parseBearerToken(authorization: string | undefined): string | undefined {
  if (!authorization?.startsWith('Bearer ')) {
    return undefined;
  }
  const token = authorization.slice('Bearer '.length).trim();
  return token || undefined;
}

@Injectable()
export class StudioAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    private readonly studioAuth: StudioAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(STUDIO_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const studioConfig = this.config.get<StudioAuthConfig>('studioAuth');
    if (studioConfig?.disabled) {
      return true;
    }

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<StudioAuthenticatedRequest>();
    const token = parseBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException({
        errorCode: ErrorCode.UNAUTHORIZED,
        message: 'Studio authentication required',
      });
    }

    request.studio = await this.studioAuth.resolveContextFromToken(token);
    return true;
  }
}
