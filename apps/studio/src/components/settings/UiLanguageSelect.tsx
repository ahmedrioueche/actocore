import { useTranslation } from 'react-i18next';

import CustomSelect from '@/components/ui/CustomSelect';
import {
  applyStudioLanguage,
  STUDIO_LANGUAGES,
  studioLanguageToAccountLocale,
  type StudioLanguage,
} from '@/constants/languages';
import { useAuth } from '@/context/AuthContext';
import { useUpdateAccountSettings } from '@/hooks/use-account';

interface UiLanguageSelectProps {
  labelKey?: string;
  hintKey?: string;
  /** When set, controls the select instead of reading from i18n. */
  value?: StudioLanguage;
  onChange?: (lang: StudioLanguage) => void;
  /** Persist defaultLocale to the workspace account (immediate save). */
  syncToAccount?: boolean;
  disabled?: boolean;
}

export function UiLanguageSelect({
  labelKey = 'settings.language',
  hintKey = 'settings.languageHint',
  value,
  onChange,
  syncToAccount = false,
  disabled = false,
}: UiLanguageSelectProps) {
  const { t, i18n } = useTranslation();
  const { session, isAuthenticated } = useAuth();
  const updateSettings = useUpdateAccountSettings();

  const options = Object.entries(STUDIO_LANGUAGES).map(([code, { label }]) => ({
    value: code,
    label,
  }));

  const selectedLanguage =
    value ?? (i18n.resolvedLanguage as StudioLanguage | undefined) ?? 'en';
  const resolvedValue = options.some((option) => option.value === selectedLanguage)
    ? selectedLanguage
    : 'en';

  const handleChange = (next: string) => {
    if (!(next in STUDIO_LANGUAGES)) {
      return;
    }
    const lang = next as StudioLanguage;

    if (onChange) {
      onChange(lang);
    } else {
      applyStudioLanguage(lang);
      void i18n.changeLanguage(lang);
    }

    if (
      syncToAccount &&
      isAuthenticated &&
      session &&
      !updateSettings.isPending
    ) {
      const accountLocale = studioLanguageToAccountLocale(lang);
      if (session.account.defaultLocale !== accountLocale) {
        void updateSettings.mutateAsync({ defaultLocale: accountLocale });
      }
    }
  };

  return (
    <div className="space-y-1.5">
      <CustomSelect
        title={t(labelKey)}
        options={options}
        selectedOption={resolvedValue}
        onChange={handleChange}
        showIcon
        disabled={disabled || updateSettings.isPending}
      />
      <p className="text-xs leading-relaxed text-text-secondary">
        {t(hintKey)}
      </p>
    </div>
  );
}
