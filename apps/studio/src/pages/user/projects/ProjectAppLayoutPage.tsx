import { AppLayoutGraphView } from "@/components/app-layout/graph/AppLayoutGraphView";
import { AppLayoutIntegrationSection } from "@/components/app-layout/AppLayoutIntegrationSection";
import { AppPagesTable } from "@/components/app-layout/AppPagesTable";
import { PageHeader } from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useProject } from "@/hooks/use-projects";
import { canWriteActions } from "@/lib/studio-permissions";
import {
  readAppLayoutViewMode,
  writeAppLayoutViewMode,
  type AppLayoutViewMode,
} from "@/stores/app-layout-view";
import { useModalStore } from "@/stores/modal";
import { useParams } from "@tanstack/react-router";
import { LayoutGrid, Map, Table2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function ProjectAppLayoutPage() {
  const { t } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const { session } = useAuth();
  const openModal = useModalStore((state) => state.openModal);

  const projectQuery = useProject(projectId ?? null);
  const canWrite = canWriteActions(session);
  const projectName = projectQuery.data?.name;

  const [viewMode, setViewMode] = useState<AppLayoutViewMode>("graph");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!projectId) {
      return;
    }
    setViewMode(readAppLayoutViewMode(projectId));
  }, [projectId]);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

  const handleViewChange = (mode: AppLayoutViewMode) => {
    setViewMode(mode);
    if (projectId) {
      writeAppLayoutViewMode(projectId, mode);
    }
  };

  const handleCreatePage = () => {
    if (!projectId) {
      return;
    }
    openModal("createAppPage", { projectId, pageKind: "screen" });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!isFullscreen ? (
        <PageHeader
          title={t("projectPages.sections.layout.title")}
          subtitle={
            projectName
              ? t("projectPages.sectionSubtitle", { project: projectName })
              : t("projectPages.sections.layout.emptyDescription")
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="inline-flex rounded-xl border border-border bg-surface p-1"
                role="tablist"
                aria-label={t("projectLayout.view.toggleLabel")}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === "graph"}
                  onClick={() => handleViewChange("graph")}
                  className={
                    viewMode === "graph"
                      ? "inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                      : "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover"
                  }
                >
                  <LayoutGrid className="h-4 w-4" />
                  {t("projectLayout.view.graph")}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === "table"}
                  onClick={() => handleViewChange("table")}
                  className={
                    viewMode === "table"
                      ? "inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                      : "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover"
                  }
                >
                  <Table2 className="h-4 w-4" />
                  {t("projectLayout.view.table")}
                </button>
              </div>

              {canWrite && projectId && viewMode === "table" ? (
                <Button
                  icon={<Map className="h-4 w-4" />}
                  onClick={handleCreatePage}
                >
                  {t("projectLayout.create.button")}
                </Button>
              ) : null}
            </div>
          }
        />
      ) : null}

      {projectId ? (
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          {viewMode === "graph" ? (
            <AppLayoutGraphView
              projectId={projectId}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen((value) => !value)}
            />
          ) : (
            <div className="space-y-8">
              <AppPagesTable projectId={projectId} />
              <AppLayoutIntegrationSection />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
