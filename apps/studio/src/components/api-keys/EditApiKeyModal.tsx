import type { ApiKeyMetadata } from '@ahmedrioueche/actocore-shared';
import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/components/ui/BaseModal';
import InputField from '@/components/ui/InputField';
import { getApiErrorMessage } from '@/utils/statusMessage';

interface EditApiKeyModalProps {
  isOpen: boolean;
  apiKey: ApiKeyMetadata | null;
  loading?: boolean;
  onClose: () => void;
  onSave: (keyId: string, name: string) => Promise<void>;
}

export function EditApiKeyModal({
  isOpen,
  apiKey,
  loading,
  onClose,
  onSave,
}: EditApiKeyModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && apiKey) {
      setName(apiKey.name ?? '');
      setError(null);
    }
  }, [isOpen, apiKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t('apiKeys.edit.nameRequired'));
      return;
    }

    setError(null);
    try {
      await onSave(apiKey.id, trimmedName);
      onClose();
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
      onClose={onClose}
      title={t('apiKeys.edit.title')}
      subtitle={t('apiKeys.edit.subtitle')}
      icon={Pencil}
      maxWidth="max-w-md"
      primaryButton={{
        label: t('apiKeys.edit.submit'),
        type: 'submit',
        form: 'edit-api-key-form',
        loading,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: onClose,
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
