import { Outlet } from '@tanstack/react-router';

import { StudioAssistant } from '@/components/assistant/StudioAssistant';
import Nav from '@/components/layout/nav/Nav';
import { PlatformProfileMenu } from '@/components/layout/nav/PlatformProfileMenu';
import { SuperAdminBadge } from '@/components/layout/nav/SuperAdminBadge';
import { useAdminNav } from '@/hooks/use-admin-nav';
import { signOutPlatform } from '@/lib/platform-session';

export default function AdminLayout() {
  const { links, defaultPath } = useAdminNav();

  return (
    <Nav
      sidebarLinks={links}
      navMode="workspace"
      logoTo={defaultPath}
      headerBadge={<SuperAdminBadge />}
      profileMenu={
        <PlatformProfileMenu
          onLogout={() => void signOutPlatform()}
        />
      }
      onLogout={() => void signOutPlatform()}
    >
      <Outlet />
      <StudioAssistant />
    </Nav>
  );
}
