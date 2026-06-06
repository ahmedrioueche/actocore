import { useTranslation } from 'react-i18next';

import { ACCOUNT_LOCALE_OPTIONS } from '@/constants/account-locales';

interface OnboardingLocaleSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}

export function OnboardingLocaleSelect({
  id = 'onboarding-locale',
  value,
  onChange,
}: OnboardingLocaleSelectProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-text-primary"
      >
        {t('onboarding.workspace.locale')}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="onboarding-select block w-full rounded-xl border border-border bg-surface py-3 pl-3 pr-10 text-sm text-text-primary transition-all duration-200 hover:border-primary/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">{t('onboarding.workspace.localePlaceholder')}</option>
        {ACCOUNT_LOCALE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="text-xs leading-relaxed text-text-secondary">
        {t('onboarding.workspace.localeHint')}
      </p>
    </div>
  );
}
