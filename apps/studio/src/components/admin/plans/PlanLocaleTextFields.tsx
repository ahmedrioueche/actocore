import type { StudioPlanLocaleText } from '@ahmedrioueche/actocore-shared';
import { useTranslation } from 'react-i18next';

import InputField from '@/components/ui/InputField';
import TextArea from '@/components/ui/TextArea';

interface PlanLocaleTextFieldsProps {
  label: string;
  value: StudioPlanLocaleText;
  onChange: (value: StudioPlanLocaleText) => void;
  multiline?: boolean;
  placeholderEn?: string;
  placeholderFr?: string;
}

export function PlanLocaleTextFields({
  label,
  value,
  onChange,
  multiline = false,
  placeholderEn,
  placeholderFr,
}: PlanLocaleTextFieldsProps) {
  const { t } = useTranslation();

  const updateLocale = (locale: 'en' | 'fr', next: string) => {
    onChange({ ...value, [locale]: next });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-text-primary">{label}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {multiline ? (
          <>
            <TextArea
              label={t('admin.plans.localeEn')}
              value={value.en ?? ''}
              onChange={(e) => updateLocale('en', e.target.value)}
              placeholder={placeholderEn}
              rows={3}
            />
            <TextArea
              label={t('admin.plans.localeFr')}
              value={value.fr ?? ''}
              onChange={(e) => updateLocale('fr', e.target.value)}
              placeholder={placeholderFr}
              rows={3}
            />
          </>
        ) : (
          <>
            <InputField
              label={t('admin.plans.localeEn')}
              value={value.en ?? ''}
              onChange={(e) => updateLocale('en', e.target.value)}
              placeholder={placeholderEn}
            />
            <InputField
              label={t('admin.plans.localeFr')}
              value={value.fr ?? ''}
              onChange={(e) => updateLocale('fr', e.target.value)}
              placeholder={placeholderFr}
            />
          </>
        )}
      </div>
    </div>
  );
}
