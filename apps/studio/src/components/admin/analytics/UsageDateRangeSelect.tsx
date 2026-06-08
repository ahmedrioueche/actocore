import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import CustomSelect from '@/components/ui/CustomSelect';
import type { UsageDateRangePreset } from '@/hooks/use-usage-date-range';

interface UsageDateRangeSelectProps {
  value: UsageDateRangePreset;
  onChange: (value: UsageDateRangePreset) => void;
}

export function UsageDateRangeSelect({
  value,
  onChange,
}: UsageDateRangeSelectProps) {
  const { t } = useTranslation();

  const options = useMemo(
    () =>
      [
        { value: '7d' as const, label: t('admin.usage.dateRange.7d') },
        { value: '30d' as const, label: t('admin.usage.dateRange.30d') },
        { value: 'month' as const, label: t('admin.usage.dateRange.month') },
      ] satisfies { value: UsageDateRangePreset; label: string }[],
    [t],
  );

  return (
    <CustomSelect
      title={t('admin.usage.dateRange.label')}
      options={options}
      selectedOption={value}
      onChange={onChange}
      showIcon={false}
    />
  );
}
