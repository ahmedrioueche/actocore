import { useLocation } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import useScreen from '@/hooks/useScreen';
import { useLogout } from '@/hooks/use-auth';
import { signOut } from '@/lib/auth-session';

const SIDEBAR_PIN_KEY = 'studio.sidebar.pinned';

export function useNav() {
  const { pathname } = useLocation();
  const logout = useLogout();
  const { isMobile } = useScreen();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(
    () => localStorage.getItem(SIDEBAR_PIN_KEY) === 'true',
  );

  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeRoute = pathname;
  const isCollapsed = !sidebarExpanded && !isMobile && !isPinned;

  useEffect(() => {
    if (!sidebarOpen || !isMobile) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setSidebarOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen, isMobile]);

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_PIN_KEY, String(next));
      return next;
    });
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onError: () => {
        void signOut('/login');
      },
    });
  };

  return {
    sidebarOpen,
    setSidebarOpen,
    sidebarExpanded,
    setSidebarExpanded,
    isPinned,
    togglePin,
    sidebarRef,
    isMobile,
    activeRoute,
    isCollapsed,
    handleLogout,
    logoutPending: logout.isPending,
  };
}
