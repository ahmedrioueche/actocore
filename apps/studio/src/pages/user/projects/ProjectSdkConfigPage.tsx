import { useParams } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { PageHeader } from "@/components/layout/PageHeader";
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
    savedFormState !== null && isSdkConfigFormDirty(formState, savedFormState);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateSdkConfigForm(formState);
    if (validationError) {
      toast.error(t(`sdkConfig.errors.${validationError}`));
      return;
    }

    try {
      await updateConfig.mutateAsync(formStateToPatch(formState));
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
        loadingVariant="form"
      >
        {projectId ? (
          <div className="space-y-4">
            <Tip title={t("sdkConfig.loadRemoteConfigTip.title")}>
              <p>{t("sdkConfig.loadRemoteConfigTip.body")}</p>
              <pre className="overflow-x-auto rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary whitespace-pre-wrap">
                {t("sdkConfig.loadRemoteConfigTip.codeExample")}
              </pre>
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
                value={formState}
                onChange={setFormState}
                disabled={!canWrite}
              />
            </form>
          </div>
        ) : null}
      </AsyncContent>
    </>
  );
}
