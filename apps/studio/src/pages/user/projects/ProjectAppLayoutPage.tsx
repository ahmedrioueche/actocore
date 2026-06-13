import { AppLayoutIntegrationSection } from "@/components/app-layout/AppLayoutIntegrationSection";
import { AppPagesTable } from "@/components/app-layout/AppPagesTable";
import { PageHeader } from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useProject } from "@/hooks/use-projects";
import { canWriteActions } from "@/lib/studio-permissions";
import { useModalStore } from "@/stores/modal";
import { useParams } from "@tanstack/react-router";
import { Map } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ProjectAppLayoutPage() {
  const { t } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const { session } = useAuth();
  const openModal = useModalStore((state) => state.openModal);

  const projectQuery = useProject(projectId ?? null);
  const canWrite = canWriteActions(session);
  const projectName = projectQuery.data?.name;

  return (
    <>
      <PageHeader
        title={t("projectPages.sections.layout.title")}
        subtitle={
          projectName
            ? t("projectPages.sectionSubtitle", { project: projectName })
            : t("projectPages.sections.layout.emptyDescription")
        }
        actions={
          canWrite && projectId ? (
            <Button
              icon={<Map className="h-4 w-4" />}
              onClick={() => openModal("createAppPage", { projectId })}
            >
              {t("projectLayout.create.button")}
            </Button>
          ) : null
        }
      />

      {projectId ? (
        <div className="space-y-8">
          <AppPagesTable projectId={projectId} />
          <AppLayoutIntegrationSection />
        </div>
      ) : null}
    </>
  );
}
