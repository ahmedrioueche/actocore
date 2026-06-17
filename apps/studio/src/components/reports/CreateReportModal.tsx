import { MessageSquarePlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StudioReportType } from '@ahmedrioueche/actocore-shared';

import BaseModal from '@/components/ui/BaseModal';
import CustomSelect from '@/components/ui/CustomSelect';
import InputField from '@/components/ui/InputField';
import TextArea from '@/components/ui/TextArea';
import { useCreateReport } from '@/hooks/use-reports';
import { useModalStore } from '@/stores/modal';
import { toast } from '@/stores/toast';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

const REPORT_TYPES = [
  StudioReportType.ISSUE,
  StudioReportType.FEEDBACK,
] as const;

export default function CreateReportModal() {
  const { t } = useTranslation();
  const currentModal = useModalStore((state) => state.currentModal);
  const closeModal = useModalStore((state) => state.closeModal);
  const createReport = useCreateReport();

  const isOpen = currentModal === 'createReport';
  const [type, setType] = useState<StudioReportType>(StudioReportType.ISSUE);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const typeOptions = useMemo(
    () =>
      REPORT_TYPES.map((value) => ({
        value,
        label: t(`reports.types.${value}`),
      })),
    [t],
  );

  useEffect(() => {
    if (!isOpen) return;
    setType(StudioReportType.ISSUE);
    setSubject('');
    setMessage('');
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 10) {
      toast.error(t('reports.modals.create.messageMin'));
      return;
    }

    try {
      await createReport.mutateAsync({
        type,
        subject: subject.trim() || undefined,
        message: trimmedMessage,
      });
      toast.success(t('reports.modals.create.success'));
      closeModal();
    } catch (err) {
      toast.error(getUnknownApiErrorMessage(t, err));
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={t('reports.modals.create.title')}
      subtitle={t('reports.modals.create.subtitle')}
      icon={MessageSquarePlus}
      primaryButton={{
        label: t('reports.modals.create.submit'),
        type: 'submit',
        form: 'create-report-form',
        loading: createReport.isPending,
        disabled: createReport.isPending,
        variant: 'primary',
      }}
    >
      <form id="create-report-form" onSubmit={handleSubmit} className="space-y-4">
        <CustomSelect
          title={t('reports.modals.create.type')}
          options={typeOptions}
          selectedOption={type}
          onChange={setType}
        />

        <InputField
          label={t('reports.modals.create.subject')}
          placeholder={t('reports.modals.create.subjectPlaceholder')}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <TextArea
          label={t('reports.modals.create.message')}
          placeholder={t('reports.modals.create.messagePlaceholder')}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </form>
    </BaseModal>
  );
}
