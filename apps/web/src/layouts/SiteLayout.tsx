import { Outlet } from 'react-router-dom';

import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { useHashScroll } from '@/hooks/useHashScroll';

export function SiteLayout() {
  useHashScroll();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mesh-gradient flex flex-1 flex-col">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
