import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/layout/PageHeader';
import { OnboardingLocaleSelect } from '@/components/onboarding/OnboardingLocaleSelect';
import { ThemeModeSelect } from '@/components/theme/ThemeModeSelect';
import { AsyncContent } from '@/components/states';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/InputField';
import {
  isAccountLocaleCode,
  resolveBrowserAccountLocale,
} from '@/constants/account-locales';
import {
  useAccountSettings,
  useUpdateAccountSettings,
} from '@/hooks/use-account';
import { getApiErrorMessage } from '@/utils/statusMessage';

export default function SettingsPage() {
  const { t } = useTranslation();
  const settingsQuery = useAccountSettings();
  const updateSettings = useUpdateAccountSettings();

  const [name, setName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [timezone, setTimezone] = useState('');
  const [defaultLocale, setDefaultLocale] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const data = settingsQuery.data;
    if (!data) {
      return;
    }
    setName(data.name);
    setBillingEmail(data.billingEmail ?? '');
    setTimezone(data.timezone ?? '');
    setDefaultLocale(
      data.defaultLocale && isAccountLocaleCode(data.defaultLocale)
        ? data.defaultLocale
        : resolveBrowserAccountLocale(),
    );
  }, [settingsQuery.data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaved(false);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError(t('settings.nameRequired'));
      return;
    }

    try {
      await updateSettings.mutateAsync({
        name: trimmedName,
        billingEmail: billingEmail.trim() || undefined,
        timezone: timezone.trim() || undefined,
        defaultLocale: defaultLocale.trim() || undefined,
      });
      setSaved(true);
    } catch (err) {
      const code = (err as Error & { errorCode?: string }).errorCode;
      setFormError(
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
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />

      <AsyncContent
        isLoading={settingsQuery.isLoading}
        isError={settingsQuery.isError}
        onRetry={() => void settingsQuery.refetch()}
        loadingVariant="form"
      >
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="space-y-5 rounded-2xl bg-surface p-6 shadow-sm md:p-8"
        >
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

          <OnboardingLocaleSelect
            id="settings-locale"
            value={defaultLocale}
            onChange={setDefaultLocale}
          />

          {formError ? (
            <p
              className="rounded-lg border border-danger/15 bg-danger-surface/80 px-3.5 py-2.5 text-sm text-danger"
              role="alert"
            >
              {formError}
            </p>
          ) : null}

          {saved ? (
            <p className="text-sm font-medium text-success" role="status">
              {t('settings.saved')}
            </p>
          ) : null}

          <Button type="submit" loading={updateSettings.isPending}>
            {t('settings.save')}
          </Button>
        </form>
      </AsyncContent>

      <section className="mt-6 space-y-4 rounded-2xl bg-surface p-6 shadow-sm md:p-8">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {t('settings.appearanceTitle')}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {t('settings.appearanceSubtitle')}
          </p>
        </div>
        <ThemeModeSelect id="settings-theme" />
      </section>
    </>
  );
}
