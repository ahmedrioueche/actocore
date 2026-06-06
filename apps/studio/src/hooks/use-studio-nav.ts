import {
  getProjectNavLinks,
  parseProjectIdFromPath,
  STUDIO_NAV_LINKS,
  type StudioNavLink,
} from '@/constants/navigation';
import { useAuth } from '@/context/AuthContext';
import { filterNavLinks } from '@/lib/studio-permissions';
import { useLocation } from '@tanstack/react-router';

export type StudioNavMode = 'workspace' | 'project';

export function useStudioNav(): {
  mode: StudioNavMode;
  projectId: string | null;
  links: StudioNavLink[];
} {
  const { pathname } = useLocation();
  const { session } = useAuth();
  const projectId = parseProjectIdFromPath(pathname);

  if (projectId) {
    return {
      mode: 'project',
      projectId,
      links: filterNavLinks(session, getProjectNavLinks(projectId)),
    };
  }

  return {
    mode: 'workspace',
    projectId: null,
    links: filterNavLinks(session, STUDIO_NAV_LINKS),
  };
}
