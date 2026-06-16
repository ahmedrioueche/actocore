import { MessageSquarePlus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/layout/PageHeader';
import Error from '@/components/ui/Error';
import Button from '@/components/ui/Button';
import { useReports } from '@/hooks/use-reports';
import { useModalStore } from '@/stores/modal';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';

import { ReportsTable } from './ReportsTable';

export default function ReportsPage() {
  const { t } = useTranslation();
  const openModal = useModalStore((state) => state.openModal);
  const [page, setPage] = useState(1);
  const reportsQuery = useReports(page, DEFAULT_PAGE_SIZE);
  const reports = reportsQuery.data?.items ?? [];

  return (
    <>
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
        actions={
          <Button
            type="button"
            onClick={() => openModal('createReport', {})}
            className="gap-2"
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden />
            {t('reports.newReport')}
          </Button>
        }
      />

      {reportsQuery.isError ? (
        <Error onRetry={() => void reportsQuery.refetch()} />
      ) : (
        <ReportsTable
          reports={reports}
          isLoading={reportsQuery.isLoading}
          meta={reportsQuery.data}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
