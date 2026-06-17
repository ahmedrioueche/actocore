import { ClipboardList } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PlatformPermission,
  StudioReportStatus,
} from '@ahmedrioueche/actocore-shared';

import Loading from '@/components/ui/Loading';
import Error from '@/components/ui/Error';
import BaseModal from '@/components/ui/BaseModal';
import CustomSelect from '@/components/ui/CustomSelect';
import { usePlatformMe } from '@/hooks/use-platform-auth';
import {
  usePlatformReport,
  useUpdateReportStatus,
} from '@/hooks/use-platform-data';
import { canAccessPlatform } from '@/lib/platform-permissions';
import { useModalStore, type EditReportModalProps } from '@/stores/modal';
import { toast } from '@/stores/toast';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

const REPORT_STATUSES = [
  StudioReportStatus.OPEN,
  StudioReportStatus.RESOLVED,
] as const;

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

export default function EditReportModal() {
  const { t, i18n } = useTranslation();
  const currentModal = useModalStore((state) => state.currentModal);
  const modalProps = useModalStore((state) => state.modalProps);
  const closeModal = useModalStore((state) => state.closeModal);
  const isOpen = currentModal === 'editReport';
  const session = usePlatformMe(isOpen).data;
  const updateStatus = useUpdateReportStatus();

  const reportId = (modalProps as EditReportModalProps | null)?.reportId;
  const reportQuery = usePlatformReport(isOpen ? reportId : undefined);
  const canWrite = canAccessPlatform(session, PlatformPermission.REPORTS_WRITE);

  const [status, setStatus] = useState<StudioReportStatus>(StudioReportStatus.OPEN);

  const statusOptions = useMemo(
    () =>
      REPORT_STATUSES.map((value) => ({
        value,
        label: t(`reports.status.${value}`),
      })),
    [t],
  );

  useEffect(() => {
    if (!isOpen || !reportQuery.data) return;
    setStatus(reportQuery.data.status);
  }, [isOpen, reportQuery.data]);

  if (!isOpen) {
    return null;
  }

  const handleSave = async () => {
    if (!reportId || !canWrite || !reportQuery.data) return;
    if (status === reportQuery.data.status) return;

    try {
      await updateStatus.mutateAsync({
        reportId,
        body: { status },
      });
      toast.success(t('admin.reports.modals.edit.success'));
      closeModal();
    } catch (err) {
      toast.error(getUnknownApiErrorMessage(t, err));
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={t('admin.reports.modals.edit.title')}
      icon={ClipboardList}
      maxWidth="max-w-2xl"
      primaryButton={
        canWrite
          ? {
              label: t('admin.reports.modals.edit.save'),
              onClick: () => void handleSave(),
              loading: updateStatus.isPending,
              disabled:
                updateStatus.isPending ||
                reportQuery.isLoading ||
                !reportQuery.data ||
                status === reportQuery.data.status,
              variant: 'primary',
            }
          : undefined
      }
      showSecondaryButton={canWrite}
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
              label={t('reports.fields.workspace')}
              value={reportQuery.data.accountName}
            />
            <DetailRow
              label={t('reports.fields.reporter')}
              value={
                reportQuery.data.reporterDisplayName ??
                reportQuery.data.reporterEmail ??
                reportQuery.data.reporterUserId
              }
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

          {canWrite ? (
            <CustomSelect
              title={t('reports.fields.status')}
              options={statusOptions}
              selectedOption={status}
              onChange={setStatus}
            />
          ) : (
            <DetailRow
              label={t('reports.fields.status')}
              value={t(`reports.status.${reportQuery.data.status}`)}
            />
          )}
        </div>
      ) : null}
    </BaseModal>
  );
}
