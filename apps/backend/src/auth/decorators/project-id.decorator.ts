import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../guards/api-key.guard';

export const ProjectId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const projectId =
      request.actocore?.context?.projectId ??
      request.apiKey?.projectId ??
      request.marketingProjectId;

    if (!projectId) {
      throw new Error('ProjectId decorator requires authenticated project context');
    }
    return projectId;
  },
);
