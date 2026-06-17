import { Outlet } from '@tanstack/react-router';

import { StudioAssistant } from '@/components/assistant/StudioAssistant';
import Nav from '@/components/layout/nav/Nav';
import { ProductTourProvider } from '@/components/product-tour/ProductTourProvider';
import { useStudioNav } from '@/hooks/use-studio-nav';

export default function StudioLayout() {
  const { mode, projectId, links } = useStudioNav();

  return (
    <ProductTourProvider>
      <Nav sidebarLinks={links} navMode={mode} projectId={projectId}>
        <Outlet />
        <StudioAssistant />
      </Nav>
    </ProductTourProvider>
  );
}
