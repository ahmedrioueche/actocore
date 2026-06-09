import { UNCATEGORIZED_SECTION_ID } from "@ahmedrioueche/actocore-shared";
import { useParams } from "@tanstack/react-router";
import { Code2, Zap } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ActionsTable } from "@/components/actions/ActionsTable";
import { SectionSidebar } from "@/components/actions/SectionSidebar";
import { PlanLimitTip } from "@/components/billing/PlanLimitTip";
import { PageHeader } from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useProjectActions } from "@/hooks/use-actions";
import { useProject } from "@/hooks/use-projects";
import { useSubscriptionSummary } from "@/hooks/use-subscription";
import { isAtPlanLimit } from "@/lib/plan-limits";
import { canWriteActions } from "@/lib/studio-permissions";
import { useModalStore } from "@/stores/modal";

export default function ProjectActionsPage() {
  const { t } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const { session } = useAuth();
  const openModal = useModalStore((state) => state.openModal);

  const projectQuery = useProject(projectId ?? null);
  const summaryQuery = useSubscriptionSummary();
  const actionsQuery = useProjectActions(projectId ?? null, {
    page: 1,
    limit: 1,
  });
  const canWrite = canWriteActions(session);
  const projectName = projectQuery.data?.name;
  const actionsUsed = actionsQuery.data?.total ?? 0;
  const actionLimit = summaryQuery.data?.limits.maxActionsPerProject;
  const atActionLimit = isAtPlanLimit(actionsUsed, actionLimit);
  const hasActions = actionsUsed > 0;

  const [selectedSectionId, setSelectedSectionId] = useState<
    string | undefined
  >(undefined);

  const realSectionId =
    selectedSectionId && selectedSectionId !== UNCATEGORIZED_SECTION_ID
      ? selectedSectionId
      : undefined;

  return (
    <>
      <PageHeader
        title={t("projectPages.sections.actions.title")}
        subtitle={
          projectName
            ? t("projectPages.sectionSubtitle", { project: projectName })
            : t("projectPages.sections.actions.emptyDescription")
        }
        actions={
          projectId ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                icon={<Code2 className="h-4 w-4" />}
                disabled={!hasActions}
                onClick={() =>
                  openModal("actionsSdkCode", {
                    projectId,
                  })
                }
              >
                {t("projectActions.generateCode.button")}
              </Button>
              {canWrite ? (
                <Button
                  icon={<Zap className="h-4 w-4" />}
                  disabled={atActionLimit}
                  onClick={() =>
                    openModal("createAction", {
                      projectId,
                      defaultSectionId: realSectionId,
                    })
                  }
                >
                  {t("projectActions.create.button")}
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />

      {atActionLimit && actionLimit != null ? (
        <PlanLimitTip kind="action" limit={actionLimit} className="mb-6" />
      ) : null}

      {projectId ? (
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          <SectionSidebar
            projectId={projectId}
            selectedSectionId={selectedSectionId}
            onSelect={setSelectedSectionId}
            canWrite={canWrite}
          />
          <div className="min-w-0 flex-1">
            <ActionsTable projectId={projectId} sectionId={selectedSectionId} />
          </div>
        </div>
      ) : null}
    </>
  );
}
