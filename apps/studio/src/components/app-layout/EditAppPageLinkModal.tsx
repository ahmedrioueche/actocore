import { Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/components/ui/BaseModal';
import InputField from '@/components/ui/InputField';
import { useAppPageLinks, useUpdateAppPageLink } from '@/hooks/use-app-page-links';
import { useAppPages } from '@/hooks/use-app-pages';
import {
  useModalStore,
  type EditAppPageLinkModalProps,
} from '@/stores/modal';
import { toast } from '@/stores/toast';
import { getApiErrorMessage } from '@/utils/statusMessage';

export default function EditAppPageLinkModal() {
  const { t } = useTranslation();
  const currentModal = useModalStore((state) => state.currentModal);
  const modalProps = useModalStore((state) => state.modalProps);
  const closeModal = useModalStore((state) => state.closeModal);

  const isOpen = currentModal === 'editAppPageLink';
  const props = modalProps as EditAppPageLinkModalProps | null;
  const projectId = props?.projectId ?? null;
  const linkId = props?.linkId ?? null;

  const linksQuery = useAppPageLinks(isOpen ? projectId : null);
  const pagesQuery = useAppPages(isOpen ? projectId : null);
  const link = linksQuery.data?.find((entry) => entry.id === linkId);
  const pages = pagesQuery.data ?? [];

  const updateLink = useUpdateAppPageLink(projectId);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (isOpen && link) {
      setLabel(link.label ?? '');
    }
  }, [isOpen, link]);

  if (!isOpen || !projectId || !linkId || !link) {
    return null;
  }

  const sourceTitle =
    pages.find((page) => page.id === link.sourcePageId)?.title ??
    link.sourcePageId;
  const targetTitle =
    pages.find((page) => page.id === link.targetPageId)?.title ??
    link.targetPageId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateLink.mutateAsync({
        linkId,
        body: { label: label.trim() || undefined },
      });
      closeModal();
    } catch (err) {
      const code = (err as Error & { errorCode?: string }).errorCode;
      toast.error(
        getApiErrorMessage(t, {
          errorCode: code,
          message: err instanceof Error ? err.message : undefined,
        }),
      );
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={t('projectLayout.links.edit.title')}
      subtitle={t('projectLayout.links.edit.subtitle', {
        source: sourceTitle,
        target: targetTitle,
      })}
      icon={Link2}
      primaryButton={{
        label: t('projectLayout.links.edit.submit'),
        type: 'submit',
        form: 'edit-app-page-link-form',
        loading: updateLink.isPending,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
      }}
    >
      <form
        id="edit-app-page-link-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
        <InputField
          label={t('projectLayout.links.fields.label')}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t('projectLayout.links.fields.labelPlaceholder')}
        />
      </form>
    </BaseModal>
  );
}
