import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/components/ui/BaseModal';
import InputField from '@/components/ui/InputField';
import { useUpdateApiKey } from '@/hooks/use-api-keys';
import { useModalStore, type EditApiKeyModalProps } from '@/stores/modal';
import { getApiErrorMessage } from '@/utils/statusMessage';

export default function EditApiKeyModal() {
  const { t } = useTranslation();
  const currentModal = useModalStore((state) => state.currentModal);
  const modalProps = useModalStore((state) => state.modalProps);
  const closeModal = useModalStore((state) => state.closeModal);

  const isOpen = currentModal === 'editApiKey';
  const props = modalProps as EditApiKeyModalProps | null;
  const projectId = props?.projectId;
  const keyId = props?.keyId;

  const updateKey = useUpdateApiKey(projectId ?? null);

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(props?.currentName ?? '');
      setError(null);
    }
    // Only re-seed when the modal opens or targets a different key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, keyId]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyId) {
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t('apiKeys.edit.nameRequired'));
      return;
    }

    setError(null);
    try {
      await updateKey.mutateAsync({ keyId, name: trimmedName });
      closeModal();
    } catch (err) {
      const code = (err as Error & { errorCode?: string }).errorCode;
      setError(
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
      title={t('apiKeys.edit.title')}
      subtitle={t('apiKeys.edit.subtitle')}
      icon={Pencil}
      maxWidth="max-w-md"
      primaryButton={{
        label: t('apiKeys.edit.submit'),
        type: 'submit',
        form: 'edit-api-key-form',
        loading: updateKey.isPending,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <form id="edit-api-key-form" onSubmit={(e) => void handleSubmit(e)}>
        <InputField
          label={t('apiKeys.fields.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('apiKeys.fields.namePlaceholder')}
          autoFocus
        />
        {error ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </BaseModal>
  );
}
