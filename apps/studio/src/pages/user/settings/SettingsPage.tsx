import { StudioRole } from "@ahmedrioueche/actocore-shared";
import { Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { PageHeader } from "@/components/layout/PageHeader";
import { NotificationPreferencesSection } from "@/components/settings/NotificationPreferencesSection";
import { UiLanguageSelect } from "@/components/settings/UiLanguageSelect";
import { AsyncContent } from "@/components/states";
import { ThemeModeSelect } from "@/components/theme/ThemeModeSelect";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { useAuth } from "@/context/AuthContext";
import {
  useAccountSettings,
  useUpdateAccountPreferences,
  useUpdateAccountSettings,
} from "@/hooks/use-account";
import { useModalStore } from "@/stores/modal";
import { toast } from "@/stores/toast";
import { getUnknownApiErrorMessage } from "@/utils/statusMessage";

function isWorkspaceAdmin(role: StudioRole | undefined): boolean {
  return role === StudioRole.USER_ADMIN || role === StudioRole.SUPER_ADMIN;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const openModal = useModalStore((state) => state.openModal);
  const settingsQuery = useAccountSettings();
  const updateSettings = useUpdateAccountSettings();
  const updatePreferences = useUpdateAccountPreferences();

  const [name, setName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [timezone, setTimezone] = useState("");
  const [failureAlertEmails, setFailureAlertEmails] = useState(true);
  const [quotaWarningEmails, setQuotaWarningEmails] = useState(true);
  const [quotaExhaustedEmails, setQuotaExhaustedEmails] = useState(true);
  const isAdmin = isWorkspaceAdmin(session?.role);
  const canSelfDelete = Boolean(session?.user.email);

  useEffect(() => {
    const data = settingsQuery.data;
    if (!data) {
      return;
    }
    setName(data.name);
    setBillingEmail(data.billingEmail ?? "");
    setTimezone(data.timezone ?? "");
    setFailureAlertEmails(data.preferences.failureAlertEmails);
    setQuotaWarningEmails(data.preferences.quotaWarningEmails);
    setQuotaExhaustedEmails(data.preferences.quotaExhaustedEmails);
  }, [settingsQuery.data]);

  const workspaceDirty = useMemo(() => {
    const data = settingsQuery.data;
    if (!data) {
      return false;
    }
    return (
      name.trim() !== data.name ||
      billingEmail.trim() !== (data.billingEmail ?? "") ||
      timezone.trim() !== (data.timezone ?? "")
    );
  }, [settingsQuery.data, name, billingEmail, timezone]);

  const preferencesDirty = useMemo(() => {
    const data = settingsQuery.data;
    if (!data || !isAdmin) {
      return false;
    }
    return (
      failureAlertEmails !== data.preferences.failureAlertEmails ||
      quotaWarningEmails !== data.preferences.quotaWarningEmails ||
      quotaExhaustedEmails !== data.preferences.quotaExhaustedEmails
    );
  }, [
    settingsQuery.data,
    isAdmin,
    failureAlertEmails,
    quotaWarningEmails,
    quotaExhaustedEmails,
  ]);

  const isDirty = workspaceDirty || preferencesDirty;

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (workspaceDirty && !trimmedName) {
      toast.error(t("settings.nameRequired"));
      return;
    }

    try {
      const tasks: Promise<unknown>[] = [];
      if (workspaceDirty) {
        tasks.push(
          updateSettings.mutateAsync({
            name: trimmedName,
            billingEmail: billingEmail.trim() || undefined,
            timezone: timezone.trim() || undefined,
          }),
        );
      }
      if (preferencesDirty) {
        tasks.push(
          updatePreferences.mutateAsync({
            failureAlertEmails,
            quotaWarningEmails,
            quotaExhaustedEmails,
          }),
        );
      }
      await Promise.all(tasks);
      toast.success(t("settings.saved"));
    } catch (err) {
      toast.error(getUnknownApiErrorMessage(t, err));
    }
  };

  const canSave = !settingsQuery.isLoading && !settingsQuery.isError;
  const isSaving = updateSettings.isPending || updatePreferences.isPending;

  return (
    <>
      <PageHeader
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
        actions={
          canSave ? (
            <Button
              type="submit"
              form="settings-form"
              icon={<Save className="h-4 w-4" />}
              loading={isSaving}
              disabled={!isDirty}
            >
              {t("settings.save")}
            </Button>
          ) : undefined
        }
      />

      <AsyncContent
        isLoading={settingsQuery.isLoading}
        isError={settingsQuery.isError}
        onRetry={() => void settingsQuery.refetch()}
        loadingVariant="form"
      >
        <form
          id="settings-form"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
          className="space-y-6"
        >
          <section className="space-y-4 rounded-2xl bg-surface p-6 shadow-sm md:p-8">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {t("settings.appearanceTitle")}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {t("settings.appearanceSubtitle")}
              </p>
            </div>

            <ThemeModeSelect />

            <UiLanguageSelect syncToAccount />
          </section>

          {isAdmin ? (
            <NotificationPreferencesSection
              failureAlertEmails={failureAlertEmails}
              quotaWarningEmails={quotaWarningEmails}
              quotaExhaustedEmails={quotaExhaustedEmails}
              onFailureAlertEmailsChange={setFailureAlertEmails}
              onQuotaWarningEmailsChange={setQuotaWarningEmails}
              onQuotaExhaustedEmailsChange={setQuotaExhaustedEmails}
              labels={{
                title: t("settings.notifications.title"),
                subtitle: t("settings.notifications.subtitle"),
                failure: t("settings.notifications.failure"),
                failureDescription: t(
                  "settings.notifications.failureDescription",
                ),
                quotaWarning: t("settings.notifications.quotaWarning"),
                quotaWarningDescription: t(
                  "settings.notifications.quotaWarningDescription",
                ),
                quotaExhausted: t("settings.notifications.quotaExhausted"),
                quotaExhaustedDescription: t(
                  "settings.notifications.quotaExhaustedDescription",
                ),
              }}
            />
          ) : null}

          <section className="space-y-5 rounded-2xl bg-surface p-6 shadow-sm md:p-8">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {t("settings.workspaceTitle")}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {t("settings.workspaceSubtitle")}
              </p>
            </div>

            <InputField
              label={t("settings.name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("settings.namePlaceholder")}
            />

            <InputField
              label={t("settings.billingEmail")}
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              placeholder={t("settings.billingEmailPlaceholder")}
            />

            <InputField
              label={t("settings.timezone")}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder={t("settings.timezonePlaceholder")}
            />

          </section>

          <section className="space-y-4 rounded-2xl border border-danger bg-surface p-6 shadow-sm md:p-8">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {t("settings.deleteAccount.dangerTitle")}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {canSelfDelete
                  ? t("settings.deleteAccount.dangerSubtitle")
                  : t("settings.deleteAccount.seatBlocked")}
              </p>
            </div>

            {canSelfDelete ? (
              <Button
                type="button"
                variant="outline"
                color="danger"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => openModal("deleteAccount", {})}
              >
                {t("settings.deleteAccount.button")}
              </Button>
            ) : null}
          </section>
        </form>
      </AsyncContent>
    </>
  );
}
