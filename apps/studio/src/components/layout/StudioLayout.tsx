import { Outlet } from '@tanstack/react-router';

import { StudioAssistant } from '@/components/assistant/StudioAssistant';
import Nav from '@/components/layout/nav/Nav';
import { useStudioNav } from '@/hooks/use-studio-nav';

export default function StudioLayout() {
  const { mode, projectId, links } = useStudioNav();

  return (
    <Nav sidebarLinks={links} navMode={mode} projectId={projectId}>
      <Outlet />
      <StudioAssistant />
    </Nav>
  );
}
