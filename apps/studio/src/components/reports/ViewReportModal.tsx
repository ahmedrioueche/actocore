import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import Loading from '@/components/ui/Loading';
import Error from '@/components/ui/Error';
import BaseModal from '@/components/ui/BaseModal';
import { useReport } from '@/hooks/use-reports';
import { useModalStore, type ViewReportModalProps } from '@/stores/modal';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
        {label}
      </p>
      <p className="mt-1 text-sm text-text-primary">{value}</p>
    </div>
  );
}

export default function ViewReportModal() {
  const { t, i18n } = useTranslation();
  const currentModal = useModalStore((state) => state.currentModal);
  const modalProps = useModalStore((state) => state.modalProps);
  const closeModal = useModalStore((state) => state.closeModal);

  const isOpen = currentModal === 'viewReport';
  const reportId = (modalProps as ViewReportModalProps | null)?.reportId;
  const reportQuery = useReport(isOpen ? reportId : undefined);

  if (!isOpen) {
    return null;
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={t('reports.modals.view.title')}
      icon={FileText}
      showFooter={false}
      maxWidth="max-w-2xl"
    >
      {reportQuery.isLoading ? (
        <Loading />
      ) : reportQuery.isError ? (
        <Error onRetry={() => void reportQuery.refetch()} />
      ) : reportQuery.data ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailRow
              label={t('reports.fields.type')}
              value={t(`reports.types.${reportQuery.data.type}`)}
            />
            <DetailRow
              label={t('reports.fields.status')}
              value={t(`reports.status.${reportQuery.data.status}`)}
            />
            <DetailRow
              label={t('reports.fields.created')}
              value={new Date(reportQuery.data.createdAt).toLocaleString(
                i18n.language,
              )}
            />
            {reportQuery.data.subject ? (
              <DetailRow
                label={t('reports.fields.subject')}
                value={reportQuery.data.subject}
              />
            ) : null}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              {t('reports.fields.message')}
            </p>
            <p className="mt-2 whitespace-pre-wrap rounded-xl border border-border bg-surface-secondary p-4 text-sm text-text-primary">
              {reportQuery.data.message}
            </p>
          </div>
        </div>
      ) : null}
    </BaseModal>
  );
}
