import { Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/components/ui/BaseModal';
import InputField from '@/components/ui/InputField';
import TextArea from '@/components/ui/TextArea';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import {
  ACTION_NAME_PATTERN,
  DEFAULT_ACTION_INPUT_SCHEMA_TEXT,
  parseInputSchema,
} from '@/constants/actions';
import { useCreateAction } from '@/hooks/use-actions';
import { useModalStore, type CreateActionModalProps } from '@/stores/modal';
import { getApiErrorMessage } from '@/utils/statusMessage';

export default function CreateActionModal() {
  const { t } = useTranslation();
  const currentModal = useModalStore((state) => state.currentModal);
  const modalProps = useModalStore((state) => state.modalProps);
  const closeModal = useModalStore((state) => state.closeModal);

  const isOpen = currentModal === 'createAction';
  const projectId = (modalProps as CreateActionModalProps | null)?.projectId;

  const createAction = useCreateAction(projectId ?? null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [schemaText, setSchemaText] = useState(DEFAULT_ACTION_INPUT_SCHEMA_TEXT);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setSchemaText(DEFAULT_ACTION_INPUT_SCHEMA_TEXT);
      setEnabled(true);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!ACTION_NAME_PATTERN.test(trimmedName)) {
      setError(t('projectActions.errors.invalidName'));
      return;
    }

    const schema = parseInputSchema(schemaText);
    if (!schema.ok || !schema.value) {
      setError(t('projectActions.errors.invalidSchema'));
      return;
    }

    setError(null);
    try {
      await createAction.mutateAsync({
        name: trimmedName,
        description: description.trim() || undefined,
        inputSchema: schema.value,
        enabled,
      });
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
      title={t('projectActions.create.title')}
      subtitle={t('projectActions.create.subtitle')}
      icon={Zap}
      maxWidth="max-w-lg"
      primaryButton={{
        label: t('projectActions.create.submit'),
        type: 'submit',
        form: 'create-action-form',
        loading: createAction.isPending,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <form
        id="create-action-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
        <div>
          <InputField
            label={t('projectActions.fields.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('projectActions.fields.namePlaceholder')}
            autoFocus
          />
          <p className="mt-1.5 text-xs text-text-secondary">
            {t('projectActions.fields.nameHint')}
          </p>
        </div>

        <InputField
          label={t('projectActions.fields.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('projectActions.fields.descriptionPlaceholder')}
        />

        <div>
          <TextArea
            label={t('projectActions.fields.inputSchema')}
            value={schemaText}
            onChange={(e) => setSchemaText(e.target.value)}
            rows={8}
            spellCheck={false}
            className="font-mono text-xs"
          />
          <p className="mt-1.5 text-xs text-text-secondary">
            {t('projectActions.fields.inputSchemaHint')}
          </p>
        </div>

        <ToggleSwitch
          checked={enabled}
          onChange={setEnabled}
          label={t('projectActions.fields.enabled')}
        />

        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </BaseModal>
  );
}
