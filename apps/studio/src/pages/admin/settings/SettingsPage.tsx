import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/layout/PageHeader';
import { UiLanguageSelect } from '@/components/settings/UiLanguageSelect';
import { ThemeModeSelect } from '@/components/theme/ThemeModeSelect';
import { AsyncContent } from '@/components/states';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/InputField';
import {
  usePlatformChangePassword,
  usePlatformMe,
  useUpdatePlatformProfile,
} from '@/hooks/use-platform-auth';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

export default function SettingsPage() {
  const { t } = useTranslation();
  const meQuery = usePlatformMe();
  const updateProfile = useUpdatePlatformProfile();
  const changePassword = usePlatformChangePassword();

  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const user = meQuery.data?.user;
  const isMaster = meQuery.data?.isPlatformMaster;

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? '');
    }
  }, [user?.displayName, user?.id]);

  const profileDirty = useMemo(() => {
    if (!user) {
      return false;
    }
    return displayName.trim() !== (user.displayName ?? '');
  }, [displayName, user]);

  const passwordDirty = useMemo(() => {
    if (isMaster) {
      return false;
    }
    return currentPassword.length > 0 || newPassword.length > 0;
  }, [currentPassword, isMaster, newPassword]);

  const isDirty = profileDirty || passwordDirty;

  const handleSave = async () => {
    setFormError(null);
    setSaved(false);

    if (passwordDirty) {
      if (!currentPassword) {
        setFormError(t('admin.settings.currentPasswordRequired'));
        return;
      }
      if (newPassword.length < 8) {
        setFormError(t('admin.settings.passwordRequired'));
        return;
      }
    }

    try {
      const tasks: Promise<unknown>[] = [];
      if (profileDirty) {
        tasks.push(
          updateProfile.mutateAsync({
            displayName: displayName.trim() || undefined,
          }),
        );
      }
      if (passwordDirty) {
        tasks.push(
          changePassword.mutateAsync({
            currentPassword,
            newPassword,
          }),
        );
      }
      await Promise.all(tasks);
      setCurrentPassword('');
      setNewPassword('');
      setSaved(true);
    } catch (err) {
      setFormError(getUnknownApiErrorMessage(t, err));
    }
  };

  const canSave = !meQuery.isLoading && !meQuery.isError;
  const isSaving = updateProfile.isPending || changePassword.isPending;

  return (
    <>
      <PageHeader
        title={t('admin.settings.title')}
        subtitle={t('admin.settings.subtitle')}
        actions={
          canSave ? (
            <Button
              type="submit"
              form="admin-settings-form"
              loading={isSaving}
              disabled={!isDirty}
            >
              {t('admin.settings.save')}
            </Button>
          ) : undefined
        }
      />

      <AsyncContent
        isLoading={meQuery.isLoading}
        isError={meQuery.isError}
        onRetry={() => void meQuery.refetch()}
        loadingVariant="form"
      >
        <form
          id="admin-settings-form"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
          className="space-y-6"
        >
          <section className="space-y-4 rounded-2xl bg-surface p-6 shadow-sm md:p-8">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {t('admin.settings.appearanceTitle')}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {t('admin.settings.appearanceSubtitle')}
              </p>
            </div>

            <ThemeModeSelect />
            <UiLanguageSelect />
          </section>

          <section className="space-y-5 rounded-2xl bg-surface p-6 shadow-sm md:p-8">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {t('admin.settings.profileTitle')}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {t('admin.settings.profileSubtitle')}
              </p>
            </div>

            <InputField
              label={t('admin.settings.displayName')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('admin.settings.displayNamePlaceholder')}
            />

            {isMaster && user?.email ? (
              <InputField
                label={t('admin.settings.email')}
                value={user.email}
                placeholder={t('admin.settings.emailPlaceholder')}
                disabled
              />
            ) : null}

            {!isMaster && user?.username ? (
              <InputField
                label={t('admin.settings.username')}
                value={user.username}
                placeholder={t('admin.settings.usernamePlaceholder')}
                disabled
              />
            ) : null}

            <InputField
              label={t('admin.settings.role')}
              value={
                isMaster ? t('admin.team.master') : t('admin.team.manager')
              }
              placeholder={t('admin.settings.rolePlaceholder')}
              disabled
            />
          </section>

          <section className="space-y-5 rounded-2xl bg-surface p-6 shadow-sm md:p-8">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {t('admin.settings.securityTitle')}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {t('admin.settings.securitySubtitle')}
              </p>
            </div>

            {isMaster ? (
              <p className="text-sm text-text-secondary">
                {t('admin.settings.masterPasswordHint')}
              </p>
            ) : (
              <>
                <InputField
                  label={t('admin.settings.currentPassword')}
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('admin.settings.currentPasswordPlaceholder')}
                  autoComplete="current-password"
                />
                <InputField
                  label={t('admin.settings.newPassword')}
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('admin.settings.newPasswordPlaceholder')}
                  autoComplete="new-password"
                />
              </>
            )}

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
                {t('admin.settings.saved')}
              </p>
            ) : null}
          </section>
        </form>
      </AsyncContent>
    </>
  );
}
