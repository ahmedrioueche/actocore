import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import type { Request } from 'express';
import type { MarketingChatResolvedConfig } from '../../../config/marketing-chat.config';
import type { PlaygroundResolvedConfig } from '../../../config/playground.config';
import type { AuthenticatedRequest } from '../../../auth/guards/api-key.guard';
import {
  extractPlaygroundToken,
  resolveRequestOrigin,
} from './playground-origin.util';
import { PlaygroundService } from './playground.service';
import { verifyPlaygroundToken } from './playground-token.util';

@Injectable()
export class PlaygroundGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly playground: PlaygroundService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.playground.assertEnabled();

    const marketing = this.config.get<MarketingChatResolvedConfig>('marketingChat');
    if (!marketing?.allowedOrigins.length) {
      throw new ServiceUnavailableException({
        errorCode: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Playground is not configured.',
      });
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const origin = resolveRequestOrigin(request);
    if (!origin || !marketing.allowedOrigins.includes(origin)) {
      throw new ForbiddenException({
        errorCode: ErrorCode.FORBIDDEN,
        message: 'Origin not allowed.',
      });
    }

    const token = extractPlaygroundToken(request);
    if (!token) {
      throw new ForbiddenException({
        errorCode: ErrorCode.FORBIDDEN,
        message: 'Playground token required.',
      });
    }

    const playgroundConfig =
      this.config.getOrThrow<PlaygroundResolvedConfig>('playground');
    const payload = verifyPlaygroundToken(token, playgroundConfig.sessionSecret);
    if (!payload) {
      throw new ForbiddenException({
        errorCode: ErrorCode.FORBIDDEN,
        message: 'Invalid playground token.',
      });
    }

    request.playgroundToken = payload;
    return true;
  }
}

@Injectable()
export class PlaygroundBootstrapGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly playground: PlaygroundService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    this.playground.assertEnabled();

    const marketing = this.config.get<MarketingChatResolvedConfig>('marketingChat');
    if (!marketing?.allowedOrigins.length) {
      throw new ServiceUnavailableException({
        errorCode: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Playground is not configured.',
      });
    }

    const request = context.switchToHttp().getRequest<Request>();
    const origin = resolveRequestOrigin(request);
    if (!origin || !marketing.allowedOrigins.includes(origin)) {
      throw new ForbiddenException({
        errorCode: ErrorCode.FORBIDDEN,
        message: 'Origin not allowed.',
      });
    }

    return true;
  }
}
