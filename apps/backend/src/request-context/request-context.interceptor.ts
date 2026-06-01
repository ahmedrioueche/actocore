import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { RequestContextData } from '@ahmedrioueche/actocore-shared';
import { Observable } from 'rxjs';
import type { AuthenticatedRequest } from '../auth/guards/api-key.guard';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  constructor(private readonly projects: ProjectsService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.apiKey) {
      const project = await this.projects.findByIdOrFail(request.apiKey.projectId);
      const ctx: RequestContextData = {
        projectId: project.id,
        projectName: project.name,
        settings: project.settings,
        apiKeyId: request.apiKey.id,
      };
      request.actocore = { context: ctx };
    }

    return next.handle();
  }
}
