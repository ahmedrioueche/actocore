import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RequestContextData } from '@ahmedrioueche/actocore-shared';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ApiKeysService } from '../api-keys.service';

export type AuthenticatedRequest = Request & {
  apiKey?: {
    id: string;
    projectId: string;
    prefix: string;
    name?: string;
  };
  /** Set by MarketingChatGuard for public marketing routes. */
  marketingProjectId?: string;
  /** Set by PlaygroundGuard for playground config routes. */
  playgroundToken?: {
    visitorId: string;
    projectId: string;
    exp: number;
  };
  actocore?: {
    context: RequestContextData;
  };
};

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeys: ApiKeysService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const validated = await this.apiKeys.validateBearerToken(
      request.headers.authorization,
    );

    request.apiKey = validated;
    await this.apiKeys.recordUsage(validated.id);

    return true;
  }
}
