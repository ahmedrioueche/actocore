import { useTranslation } from 'react-i18next';

import {
  PlatformUsageView,
  UsageDateRangeSelect,
} from '@/components/admin/analytics';
import { PageHeader } from '@/components/layout/PageHeader';
import { usePlatformUsageOverview } from '@/hooks/use-platform-data';
import { useUsageDateRange } from '@/hooks/use-usage-date-range';

export default function UsagePage() {
  const { t } = useTranslation();
  const { preset, setPreset, from, to } = useUsageDateRange('30d');
  const usageQuery = usePlatformUsageOverview(from, to);

  return (
    <>
      <PageHeader
        title={t('admin.usage.title')}
        subtitle={t('admin.usage.subtitle')}
      />
      <div className="mb-6">
        <UsageDateRangeSelect value={preset} onChange={setPreset} />
      </div>
      <PlatformUsageView
        stats={usageQuery.data}
        isLoading={usageQuery.isLoading}
        isError={usageQuery.isError}
        onRetry={() => void usageQuery.refetch()}
      />
    </>
  );
}
