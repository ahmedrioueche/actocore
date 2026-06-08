import { useTranslation } from 'react-i18next';

import CustomSelect from '@/components/ui/CustomSelect';
import {
  persistStudioLanguage,
  STUDIO_LANGUAGES,
  type StudioLanguage,
} from '@/constants/languages';

interface UiLanguageSelectProps {
  labelKey?: string;
  hintKey?: string;
}

export function UiLanguageSelect({
  labelKey = 'settings.language',
  hintKey = 'admin.settings.uiLanguageHint',
}: UiLanguageSelectProps) {
  const { t, i18n } = useTranslation();

  const options = Object.entries(STUDIO_LANGUAGES).map(([code, { label }]) => ({
    value: code,
    label,
  }));

  const selectedLanguage = i18n.language as StudioLanguage;
  const resolvedValue = options.some((option) => option.value === selectedLanguage)
    ? selectedLanguage
    : (options[0]?.value ?? 'en');

  const handleChange = (value: string) => {
    if (!(value in STUDIO_LANGUAGES)) {
      return;
    }
    const lang = value as StudioLanguage;
    persistStudioLanguage(lang);
    void i18n.changeLanguage(lang);
  };

  return (
    <div className="space-y-1.5">
      <CustomSelect
        title={t(labelKey)}
        options={options}
        selectedOption={resolvedValue}
        onChange={handleChange}
        showIcon
      />
      <p className="text-xs leading-relaxed text-text-secondary">
        {t(hintKey)}
      </p>
    </div>
  );
}
