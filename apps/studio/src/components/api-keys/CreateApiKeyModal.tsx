import { Dices, KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/components/ui/BaseModal';
import InputField from '@/components/ui/InputField';
import { getRandomApiKeyName } from '@/constants/api-keys';
import { useCreateApiKey } from '@/hooks/use-api-keys';
import { useFeatureModal } from '@/hooks/use-feature-modal';
import { useModalStore, type CreateApiKeyModalProps  } from '@/stores/modal';
import { toast } from '@/stores/toast';
import { getApiErrorMessage } from '@/utils/statusMessage';

export default function CreateApiKeyModal() {
  const { t } = useTranslation();
  const { isOpen, props, closeModal } = useFeatureModal('createApiKey');
  const openModal = useModalStore((state) => state.openModal);
  const projectId = props?.projectId;

  const createKey = useCreateApiKey(projectId ?? null);

  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(getRandomApiKeyName());
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSuggest = () => {
    setName((current) => getRandomApiKeyName(current.trim()));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const issued = await createKey.mutateAsync(name.trim() || undefined);
      openModal('issuedApiKey', { apiKey: issued.key });
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
      title={t('apiKeys.create.title')}
      subtitle={t('apiKeys.create.subtitle')}
      icon={KeyRound}
      maxWidth="max-w-md"
      primaryButton={{
        label: t('apiKeys.create.submit'),
        type: 'submit',
        form: 'create-api-key-form',
        loading: createKey.isPending,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <form id="create-api-key-form" onSubmit={(e) => void handleSubmit(e)}>
        <InputField
          label={t('apiKeys.fields.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('apiKeys.fields.namePlaceholder')}
          autoFocus
          rightIcon={
            <button
              type="button"
              onClick={handleSuggest}
              className="p-1 text-text-secondary transition-colors duration-200 hover:text-text-primary"
              title={t('apiKeys.fields.suggestName')}
              aria-label={t('apiKeys.fields.suggestName')}
            >
              <Dices className="h-5 w-5" />
            </button>
          }
        />
      </form>
    </BaseModal>
  );
}
