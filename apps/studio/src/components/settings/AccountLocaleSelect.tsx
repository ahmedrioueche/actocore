import { useTranslation } from 'react-i18next';

import CustomSelect from '@/components/ui/CustomSelect';
import { ACCOUNT_LOCALE_OPTIONS } from '@/constants/account-locales';

interface AccountLocaleSelectProps {
  value: string;
  onChange: (value: string) => void;
  labelKey?: string;
  hintKey?: string;
  placeholderKey?: string;
  allowEmpty?: boolean;
  disabled?: boolean;
  error?: string;
}

export function AccountLocaleSelect({
  value,
  onChange,
  labelKey = 'settings.language',
  hintKey = 'settings.languageHint',
  placeholderKey = 'settings.languagePlaceholder',
  allowEmpty = false,
  disabled = false,
  error,
}: AccountLocaleSelectProps) {
  const { t } = useTranslation();

  const options = [
    ...(allowEmpty
      ? [{ value: '' as const, label: t(placeholderKey) }]
      : []),
    ...ACCOUNT_LOCALE_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  ];

  const resolvedValue =
    options.some((option) => option.value === value)
      ? value
      : (allowEmpty ? '' : (options[0]?.value ?? ''));

  return (
    <div className="space-y-1.5">
      <CustomSelect
        title={t(labelKey)}
        options={options}
        selectedOption={resolvedValue}
        onChange={onChange}
        disabled={disabled}
        error={error}
        placeholder={t(placeholderKey)}
        showIcon
      />
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-xs leading-relaxed text-text-secondary">
          {t(hintKey)}
        </p>
      )}
    </div>
  );
}
