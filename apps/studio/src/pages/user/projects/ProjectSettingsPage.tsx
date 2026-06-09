import { useNavigate, useParams } from "@tanstack/react-router";
import { Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { PageHeader } from "@/components/layout/PageHeader";
import { AsyncContent } from "@/components/states";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { useAuth } from "@/context/AuthContext";
import {
  useDeleteProject,
  useProject,
  useUpdateProject,
} from "@/hooks/use-projects";
import { canDeleteProject, canWriteProjects } from "@/lib/studio-permissions";
import { useModalStore } from "@/stores/modal";
import { toast } from "@/stores/toast";
import {
  getApiErrorMessage,
  getUnknownApiErrorMessage,
} from "@/utils/statusMessage";

const FORM_ID = "project-settings-form";

export default function ProjectSettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { projectId } = useParams({ strict: false });
  const { session } = useAuth();
  const openConfirm = useModalStore((state) => state.openConfirm);

  const projectQuery = useProject(projectId ?? null);
  const updateProject = useUpdateProject(projectId ?? null);
  const deleteProject = useDeleteProject();

  const canWrite = canWriteProjects(session);
  const canDelete = canDeleteProject(session);

  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const project = projectQuery.data;

  useEffect(() => {
    if (project) {
      setName(project.name);
    }
  }, [project]);

  const isDirty = useMemo(() => {
    if (!project) {
      return false;
    }
    return name.trim() !== project.name;
  }, [project, name]);

  const createdLabel = project
    ? new Date(project.createdAt).toLocaleDateString(i18n.language, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !canWrite) {
      return;
    }

    setFormError(null);
    setSaved(false);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError(t("projectSettings.nameRequired"));
      return;
    }

    try {
      await updateProject.mutateAsync({ name: trimmedName });
      setSaved(true);
      toast.success(t("projectSettings.saved"));
    } catch (err) {
      setFormError(getUnknownApiErrorMessage(t, err));
    }
  };

  const handleDelete = () => {
    if (!project || !projectId || !canDelete) {
      return;
    }

    openConfirm({
      title: t("projectSettings.delete.title"),
      text: t("projectSettings.delete.text", { name: project.name }),
      confirmText: t("projectSettings.delete.confirm"),
      confirmVariant: "danger",
      verificationText: project.name,
      onConfirm: () => {
        void (async () => {
          try {
            await deleteProject.mutateAsync(projectId);
            toast.success(t("projectSettings.delete.success"));
            await navigate({ to: "/projects" });
          } catch (err) {
            toast.error(
              getApiErrorMessage(t, {
                errorCode: (err as Error & { errorCode?: string }).errorCode,
                message: err instanceof Error ? err.message : undefined,
              }),
            );
          }
        })();
      },
    });
  };

  return (
    <>
      <PageHeader
        title={t("projectSettings.title")}
        subtitle={
          project
            ? t("projectPages.sectionSubtitle", { project: project.name })
            : undefined
        }
        actions={
          canWrite ? (
            <Button
              type="submit"
              form={FORM_ID}
              icon={<Save className="h-4 w-4" />}
              loading={updateProject.isPending}
              disabled={!isDirty}
            >
              {t("projectSettings.save")}
            </Button>
          ) : null
        }
      />

      <AsyncContent
        isLoading={projectQuery.isLoading || !projectId}
        isError={projectQuery.isError}
        onRetry={() => void projectQuery.refetch()}
        loadingVariant="form"
      >
        {project ? (
          <div className="space-y-6">
            <form
              id={FORM_ID}
              onSubmit={(e) => void handleSubmit(e)}
              className="space-y-6"
            >
              <section className="space-y-4 rounded-2xl bg-surface p-6 shadow-sm md:p-8">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    {t("projectSettings.generalTitle")}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {t("projectSettings.generalSubtitle")}
                  </p>
                </div>

                <InputField
                  label={t("projectPages.fields.name")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("projects.create.namePlaceholder")}
                  disabled={!canWrite}
                />

                <InputField
                  label={t("projectPages.fields.id")}
                  value={project.id}
                  readOnly
                  disabled
                />

                <InputField
                  label={t("projectPages.fields.created")}
                  value={createdLabel}
                  readOnly
                  disabled
                />

                {formError ? (
                  <p
                    className="rounded-lg border border-danger/15 bg-danger-surface/80 px-3.5 py-2.5 text-sm text-danger"
                    role="alert"
                  >
                    {formError}
                  </p>
                ) : null}

                {saved && !isDirty ? (
                  <p className="text-sm font-medium text-success" role="status">
                    {t("projectSettings.saved")}
                  </p>
                ) : null}
              </section>
            </form>

            {canDelete ? (
              <section className="space-y-4 rounded-2xl border border-danger bg-surface p-6 shadow-sm md:p-8">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    {t("projectSettings.dangerTitle")}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {t("projectSettings.dangerSubtitle")}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  color="danger"
                  icon={<Trash2 className="h-4 w-4" />}
                  loading={deleteProject.isPending}
                  onClick={handleDelete}
                >
                  {t("projectSettings.delete.button")}
                </Button>
              </section>
            ) : null}
          </div>
        ) : null}
      </AsyncContent>
    </>
  );
}
