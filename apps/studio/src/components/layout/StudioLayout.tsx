import { Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { StudioAssistant } from '@/components/assistant/StudioAssistant';
import Nav from '@/components/layout/nav/Nav';
import { useOnboardingState } from '@/hooks/use-onboarding';
import { useStudioNav } from '@/hooks/use-studio-nav';
import { isOnboardingPendingState } from '@/routes/guards';

export default function StudioLayout() {
  const navigate = useNavigate();
  const { mode, projectId, links } = useStudioNav();
  const onboardingQuery = useOnboardingState();

  useEffect(() => {
    if (
      onboardingQuery.isSuccess &&
      isOnboardingPendingState(onboardingQuery.data)
    ) {
      void navigate({ to: '/onboarding', replace: true });
    }
  }, [navigate, onboardingQuery.data, onboardingQuery.isSuccess]);

  return (
    <Nav sidebarLinks={links} navMode={mode} projectId={projectId}>
      <Outlet />
      <StudioAssistant />
    </Nav>
  );
}
