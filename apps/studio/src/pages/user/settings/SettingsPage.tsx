import type { StudioAccountSettingsData } from '@ahmedrioueche/actocore-shared';
import { StudioRole } from '@ahmedrioueche/actocore-shared';
import { Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/layout/PageHeader';
import { AccountLocaleSelect } from '@/components/settings/AccountLocaleSelect';
import { NotificationPreferencesSection } from '@/components/settings/NotificationPreferencesSection';
import { ThemeModeSelect } from '@/components/theme/ThemeModeSelect';
import { AsyncContent } from '@/components/states';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/InputField';
import {
  isAccountLocaleCode,
  resolveBrowserAccountLocale,
} from '@/constants/account-locales';
import { useAuth } from '@/context/AuthContext';
import {
  useAccountSettings,
  useUpdateAccountPreferences,
  useUpdateAccountSettings,
} from '@/hooks/use-account';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

function resolveDefaultLocale(data: StudioAccountSettingsData): string {
  return data.defaultLocale && isAccountLocaleCode(data.defaultLocale)
    ? data.defaultLocale
    : resolveBrowserAccountLocale();
}

function isWorkspaceAdmin(role: StudioRole | undefined): boolean {
  return role === StudioRole.USER_ADMIN || role === StudioRole.SUPER_ADMIN;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const settingsQuery = useAccountSettings();
  const updateSettings = useUpdateAccountSettings();
  const updatePreferences = useUpdateAccountPreferences();

  const [name, setName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [timezone, setTimezone] = useState('');
  const [defaultLocale, setDefaultLocale] = useState('');
  const [failureAlertEmails, setFailureAlertEmails] = useState(true);
  const [quotaWarningEmails, setQuotaWarningEmails] = useState(true);
  const [quotaExhaustedEmails, setQuotaExhaustedEmails] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isAdmin = isWorkspaceAdmin(session?.role);

  useEffect(() => {
    const data = settingsQuery.data;
    if (!data) {
      return;
    }
    setName(data.name);
    setBillingEmail(data.billingEmail ?? '');
    setTimezone(data.timezone ?? '');
    setDefaultLocale(resolveDefaultLocale(data));
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
      billingEmail.trim() !== (data.billingEmail ?? '') ||
      timezone.trim() !== (data.timezone ?? '') ||
      defaultLocale !== resolveDefaultLocale(data)
    );
  }, [settingsQuery.data, name, billingEmail, timezone, defaultLocale]);

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
    setFormError(null);
    setSaved(false);

    const trimmedName = name.trim();
    if (workspaceDirty && !trimmedName) {
      setFormError(t('settings.nameRequired'));
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
            defaultLocale: defaultLocale.trim() || undefined,
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
      setSaved(true);
    } catch (err) {
      setFormError(getUnknownApiErrorMessage(t, err));
    }
  };

  const canSave =
    !settingsQuery.isLoading && !settingsQuery.isError;
  const isSaving = updateSettings.isPending || updatePreferences.isPending;

  return (
    <>
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        actions={
          canSave ? (
            <Button
              type="submit"
              form="settings-form"
              icon={<Save className="h-4 w-4" />}
              loading={isSaving}
              disabled={!isDirty}
            >
              {t('settings.save')}
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
                {t('settings.appearanceTitle')}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {t('settings.appearanceSubtitle')}
              </p>
            </div>

            <ThemeModeSelect />

            <AccountLocaleSelect
              value={defaultLocale}
              onChange={setDefaultLocale}
            />
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
                title: t('settings.notifications.title'),
                subtitle: t('settings.notifications.subtitle'),
                failure: t('settings.notifications.failure'),
                failureDescription: t('settings.notifications.failureDescription'),
                quotaWarning: t('settings.notifications.quotaWarning'),
                quotaWarningDescription: t(
                  'settings.notifications.quotaWarningDescription',
                ),
                quotaExhausted: t('settings.notifications.quotaExhausted'),
                quotaExhaustedDescription: t(
                  'settings.notifications.quotaExhaustedDescription',
                ),
              }}
            />
          ) : null}

          <section className="space-y-5 rounded-2xl bg-surface p-6 shadow-sm md:p-8">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {t('settings.workspaceTitle')}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {t('settings.workspaceSubtitle')}
              </p>
            </div>

            <InputField
              label={t('settings.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('settings.namePlaceholder')}
            />

            <InputField
              label={t('settings.billingEmail')}
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              placeholder={t('settings.billingEmailPlaceholder')}
            />

            <InputField
              label={t('settings.timezone')}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder={t('settings.timezonePlaceholder')}
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
                {t('settings.saved')}
              </p>
            ) : null}
          </section>
        </form>
      </AsyncContent>
    </>
  );
}
