import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../guards/api-key.guard';

export const ProjectId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.apiKey?.projectId) {
      throw new Error('ProjectId decorator requires ApiKeyGuard');
    }
    return request.apiKey.projectId;
  },
);
