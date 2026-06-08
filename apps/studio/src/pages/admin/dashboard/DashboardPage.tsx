import { useTranslation } from 'react-i18next';

import { PlatformAnalyticsView } from '@/components/admin/analytics';
import { PageHeader } from '@/components/layout/PageHeader';
import { usePlatformAnalytics } from '@/hooks/use-platform-data';
import { usePlatformMe } from '@/hooks/use-platform-auth';

export default function DashboardPage() {
  const { t } = useTranslation();
  const session = usePlatformMe();
  const analytics = usePlatformAnalytics();
  const displayName =
    session.data?.user.displayName ??
    session.data?.user.email ??
    session.data?.user.username;

  return (
    <>
      <PageHeader
        title={t('admin.dashboard.title')}
        subtitle={
          displayName
            ? t('admin.dashboard.subtitle', { name: displayName })
            : undefined
        }
      />
      <PlatformAnalyticsView
        variant="dashboard"
        stats={analytics.data}
        isLoading={analytics.isLoading}
        isError={analytics.isError}
        onRetry={() => void analytics.refetch()}
      />
    </>
  );
}
