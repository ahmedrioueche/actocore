import type { StudioNavLink } from '@/constants/navigation';
import { usePlatformMe } from '@/hooks/use-platform-auth';
import {
  getAccessibleAdminLinks,
  getDefaultAdminPath,
} from '@/lib/platform-permissions';

export function useAdminNav(): { links: StudioNavLink[]; defaultPath: string } {
  const session = usePlatformMe().data;
  const links = getAccessibleAdminLinks(session);

  return { links, defaultPath: getDefaultAdminPath(session) };
}
