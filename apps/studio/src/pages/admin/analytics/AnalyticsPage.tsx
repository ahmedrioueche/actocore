import { useTranslation } from 'react-i18next';

import { PlatformAnalyticsView } from '@/components/admin/analytics';
import { PageHeader } from '@/components/layout/PageHeader';
import { usePlatformAnalytics } from '@/hooks/use-platform-data';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const analytics = usePlatformAnalytics();

  return (
    <>
      <PageHeader
        title={t('admin.analytics.title')}
        subtitle={t('admin.analytics.subtitle')}
      />
      <PlatformAnalyticsView
        variant="analytics"
        stats={analytics.data}
        isLoading={analytics.isLoading}
        isError={analytics.isError}
        onRetry={() => void analytics.refetch()}
      />
    </>
  );
}
