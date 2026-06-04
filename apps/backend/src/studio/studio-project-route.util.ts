import type { StudioRequestContext } from './studio-context';
import { StudioAccessService } from './studio-access.service';
import { ProjectsService } from '../projects/projects.service';

/** Ensures the caller may access the project before running handler logic. */
export async function assertStudioProjectRoute(
  ctx: StudioRequestContext | null,
  projectId: string,
  access: StudioAccessService,
  projects: ProjectsService,
): Promise<void> {
  if (!ctx) {
    await projects.assertExists(projectId);
    return;
  }
  access.assertProjectAccess(ctx, projectId);
  await projects.assertExistsForAccount(ctx, projectId);
}
