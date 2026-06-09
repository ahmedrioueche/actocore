import { useLocation } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import type { StudioNavLink } from "@/constants/navigation";
import { isNavLinkActive } from "@/constants/navigation";
import { cn } from "@/utils/helper";
import { resetAllScrollers } from "@/utils/scroll";

import { NavLogo } from "./NavLogo";
import { ProfileMenu } from "./ProfileMenu";
import { ProjectContextBadge } from "./ProjectContextBadge";
import { SidebarFooter } from "./SidebarFooter";
import { SidebarMenuItem } from "./SidebarMenuItem";
import { useNav } from "./useNav";
import { WorkspaceBadge } from "./WorkspaceBadge";

interface NavProps {
  children: ReactNode;
  sidebarLinks: StudioNavLink[];
  navMode: "workspace" | "project";
  projectId?: string | null;
  logoTo?: string;
  headerBadge?: ReactNode;
  profileMenu?: ReactNode;
  onLogout?: () => void;
  logoutPending?: boolean;
}

export default function Nav({
  children,
  sidebarLinks,
  navMode,
  projectId,
  logoTo,
  headerBadge,
  profileMenu,
  onLogout,
  logoutPending: logoutPendingProp,
}: NavProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navScrollRef = useRef<HTMLElement>(null);
  const activeMenuItemRef = useRef<HTMLDivElement>(null);

  const {
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
    logoutPending,
  } = useNav({ onLogout, logoutPending: logoutPendingProp });

  useEffect(() => {
    resetAllScrollers();
  }, [pathname]);

  useEffect(() => {
    const item = activeMenuItemRef.current;
    const nav = navScrollRef.current;
    if (!item || !nav || sidebarLinks.length === 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      item.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, activeRoute, sidebarLinks]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed z-40 flex h-screen flex-col overflow-hidden border-border bg-surface transition-all duration-300 md:relative",
          "border-e shadow-sm",
          isMobile
            ? cn("w-64", sidebarOpen ? "translate-x-0" : "-translate-x-full")
            : isPinned || sidebarExpanded
              ? "w-52"
              : "w-[4.5rem]",
        )}
        onMouseEnter={() => !isMobile && !isPinned && setSidebarExpanded(true)}
        onMouseLeave={() => !isMobile && !isPinned && setSidebarExpanded(false)}
      >
        <div className="flex min-w-0 items-center justify-between overflow-hidden border-b border-border">
          <NavLogo
            collapsed={isCollapsed}
            onNavigate={() => setSidebarOpen(false)}
            to={logoTo}
          />
          {isMobile ? (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="me-3 rounded-lg p-2 transition-colors hover:bg-surface-hover"
              aria-label={t("common.close")}
            >
              <X className="h-5 w-5 text-text-primary" />
            </button>
          ) : null}
        </div>

        <nav
          ref={navScrollRef}
          className="flex-1 space-y-1 overflow-y-auto px-2 py-3 hide-scrollbar"
          aria-label={t("nav.title")}
        >
          {!isCollapsed && navMode === "project" ? (
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
              {t("nav.project.section")}
            </p>
          ) : null}

          {sidebarLinks.map((link) => {
            const isActive = isNavLinkActive(activeRoute, link);
            return (
              <div
                key={link.path}
                ref={isActive ? activeMenuItemRef : undefined}
                className="scroll-my-2"
              >
                <SidebarMenuItem
                  link={link}
                  isActive={isActive}
                  isCollapsed={isCollapsed}
                  onItemClick={() => setSidebarOpen(false)}
                />
              </div>
            );
          })}
        </nav>

        <SidebarFooter
          isMobile={isMobile}
          isPinned={isPinned}
          isCollapsed={isCollapsed}
          onTogglePin={togglePin}
          onLogout={handleLogout}
          logoutPending={logoutPending}
        />
      </aside>

      {isMobile && sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
          aria-label={t("common.close")}
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-3 py-2 md:min-h-[4.5rem] md:px-4">
          <div
            className={`flex min-w-0 items-center gap-2 md:gap-3 ${!isMobile ? "px-12" : ""}`}
          >
            {isMobile ? (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="shrink-0 rounded-xl border border-border bg-background p-2 shadow-sm transition-colors hover:bg-surface-hover"
                aria-label={t("nav.openMenu")}
              >
                <Menu className="h-5 w-5 text-text-primary" />
              </button>
            ) : null}

            {headerBadge ??
              (navMode === "project" && projectId ? (
                <ProjectContextBadge projectId={projectId} />
              ) : (
                <WorkspaceBadge />
              ))}
          </div>

          {profileMenu ?? (
            <ProfileMenu
              onLogout={handleLogout}
              logoutPending={logoutPending}
            />
          )}
        </header>

        <main
          id="studio-content-scroller"
          data-scroll-container
          className="flex flex-1  flex-col overflow-auto"
        >
          <div className="studio-page pb-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
