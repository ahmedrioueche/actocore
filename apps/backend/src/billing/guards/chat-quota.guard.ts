import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { AuthenticatedRequest } from '../../auth/guards/api-key.guard';
import { QuotaService } from '../quota.service';

@Injectable()
export class ChatQuotaGuard implements CanActivate {
  constructor(private readonly quota: QuotaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const projectId =
      request.actocore?.context?.projectId ??
      request.apiKey?.projectId ??
      request.marketingProjectId;

    if (!projectId) {
      return true;
    }

    await this.quota.consumeChatQuota(projectId);
    return true;
  }
}
