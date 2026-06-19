import { PageHeader } from "@/components/layout/PageHeader";
import { DocsLearnMoreLink } from "@/components/projects/docs/DocsLearnMoreLink";
import { SdkConfigForm } from "@/components/sdk-config/SdkConfigForm";
import { AsyncContent } from "@/components/states";
import Button from "@/components/ui/Button";
import Tip from "@/components/ui/Tip";
import { useAuth } from "@/context/AuthContext";
import { useProject } from "@/hooks/use-projects";
import { useSdkConfig, useUpdateSdkConfig } from "@/hooks/use-sdk-config";
import { canWriteSdkConfig } from "@/lib/studio-permissions";
import { toast } from "@/stores/toast";
import {
  configToFormState,
  createDefaultSdkConfigFormState,
  formStateToPatch,
  isSdkConfigFormDirty,
  validateSdkConfigForm,
  type SdkConfigFormState,
} from "@/utils/sdk-config-form";
import { getApiErrorMessage } from "@/utils/statusMessage";
import { useParams } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const FORM_ID = "sdk-config-form";

export default function ProjectSdkConfigPage() {
  const { t } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const { session } = useAuth();
  const projectQuery = useProject(projectId ?? null);
  const configQuery = useSdkConfig(projectId ?? null);
  const updateConfig = useUpdateSdkConfig(projectId ?? null);
  const canWrite = canWriteSdkConfig(session);

  const [formState, setFormState] = useState<SdkConfigFormState>(
    createDefaultSdkConfigFormState(),
  );

  const projectName = projectQuery.data?.name;

  useEffect(() => {
    if (!configQuery.data) {
      return;
    }
    setFormState(configToFormState(configQuery.data));
  }, [configQuery.data]);

  const savedFormState = useMemo(
    () => (configQuery.data ? configToFormState(configQuery.data) : null),
    [configQuery.data],
  );

  const isDirty =
    savedFormState !== null &&
    isSdkConfigFormDirty(formState, savedFormState, configQuery.data ?? undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateSdkConfigForm(formState);
    if (validationError) {
      toast.error(t(`sdkConfig.errors.${validationError}`));
      return;
    }

    try {
      await updateConfig.mutateAsync(formStateToPatch(formState, configQuery.data));
      toast.success(t("sdkConfig.saved"));
    } catch (err) {
      const code = (err as Error & { errorCode?: string }).errorCode;
      toast.error(
        getApiErrorMessage(t, {
          errorCode: code,
          message: err instanceof Error ? err.message : undefined,
        }),
      );
    }
  };

  return (
    <>
      <PageHeader
        title={t("sdkConfig.title")}
        subtitle={
          projectName
            ? t("projectPages.sectionSubtitle", { project: projectName })
            : t("projectPages.sections.sdkConfig.emptyDescription")
        }
        actions={
          canWrite ? (
            <Button
              type="submit"
              form={FORM_ID}
              icon={<Save className="h-4 w-4" />}
              loading={updateConfig.isPending}
              disabled={!isDirty}
            >
              {t("sdkConfig.save")}
            </Button>
          ) : null
        }
      />

      <AsyncContent
        isLoading={configQuery.isLoading || !projectId}
        isError={configQuery.isError}
        onRetry={() => void configQuery.refetch()}
        loadingVariant="sdk-config"
      >
        {projectId ? (
          <div className="space-y-4">
            <Tip title={t("projectDocs.contextualTips.sdkConfig.title")}>
              <p>
                {t("projectDocs.contextualTips.sdkConfig.body")}{" "}
                <DocsLearnMoreLink sectionId="sdk-config" />
              </p>
            </Tip>

            {!canWrite ? (
              <Tip variant="warning" title={t("sdkConfig.readOnlyTitle")}>
                <p>{t("sdkConfig.readOnly")}</p>
              </Tip>
            ) : null}

            <form
              id={FORM_ID}
              onSubmit={(e) => void handleSubmit(e)}
              className="space-y-6"
            >
              <SdkConfigForm
                projectId={projectId}
                value={formState}
                onChange={setFormState}
                disabled={!canWrite}
                savedConfig={configQuery.data}
              />
            </form>
          </div>
        ) : null}
      </AsyncContent>
    </>
  );
}
