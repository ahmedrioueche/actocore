import { Save } from 'lucide-react';
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
import { toast } from '@/stores/toast';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

export default function SettingsPage() {
  const { t } = useTranslation();
  const meQuery = usePlatformMe();
  const updateProfile = useUpdatePlatformProfile();
  const changePassword = usePlatformChangePassword();

  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
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
    if (passwordDirty) {
      if (!currentPassword) {
        toast.error(t('admin.settings.currentPasswordRequired'));
        return;
      }
      if (newPassword.length < 8) {
        toast.error(t('admin.settings.passwordRequired'));
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
      toast.success(t('admin.settings.saved'));
    } catch (err) {
      toast.error(getUnknownApiErrorMessage(t, err));
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
              icon={<Save className="h-4 w-4" />}
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
            <UiLanguageSelect hintKey="admin.settings.uiLanguageHint" />
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

          </section>
        </form>
      </AsyncContent>
    </>
  );
}
