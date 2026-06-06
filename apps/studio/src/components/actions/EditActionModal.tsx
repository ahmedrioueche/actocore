import { Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/components/ui/BaseModal';
import InputField from '@/components/ui/InputField';
import TextArea from '@/components/ui/TextArea';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { formatInputSchema, parseInputSchema } from '@/constants/actions';
import { useAction, useUpdateAction } from '@/hooks/use-actions';
import { useModalStore, type EditActionModalProps } from '@/stores/modal';
import { getApiErrorMessage } from '@/utils/statusMessage';

export default function EditActionModal() {
  const { t } = useTranslation();
  const currentModal = useModalStore((state) => state.currentModal);
  const modalProps = useModalStore((state) => state.modalProps);
  const closeModal = useModalStore((state) => state.closeModal);

  const isOpen = currentModal === 'editAction';
  const props = modalProps as EditActionModalProps | null;
  const projectId = props?.projectId ?? null;
  const actionId = props?.actionId ?? null;

  const actionQuery = useAction(isOpen ? projectId : null, isOpen ? actionId : null);
  const action = actionQuery.data;
  const updateAction = useUpdateAction(projectId);

  const [description, setDescription] = useState('');
  const [schemaText, setSchemaText] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seededRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      seededRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && action && !seededRef.current) {
      setDescription(action.description ?? '');
      setSchemaText(formatInputSchema(action.inputSchema));
      setEnabled(action.enabled);
      setError(null);
      seededRef.current = true;
    }
  }, [isOpen, action]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionId) {
      return;
    }

    const schema = parseInputSchema(schemaText);
    if (!schema.ok || !schema.value) {
      setError(t('projectActions.errors.invalidSchema'));
      return;
    }

    setError(null);
    try {
      await updateAction.mutateAsync({
        actionId,
        body: {
          description: description.trim() || undefined,
          inputSchema: schema.value,
          enabled,
        },
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
      title={t('projectActions.edit.title')}
      subtitle={action?.name ?? t('projectActions.edit.subtitle')}
      icon={Pencil}
      maxWidth="max-w-lg"
      primaryButton={{
        label: t('projectActions.edit.submit'),
        type: 'submit',
        form: 'edit-action-form',
        loading: updateAction.isPending,
        disabled: actionQuery.isLoading,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <form
        id="edit-action-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
        <InputField
          label={t('projectActions.fields.name')}
          value={action?.name ?? ''}
          onChange={() => undefined}
          disabled
        />

        <InputField
          label={t('projectActions.fields.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('projectActions.fields.descriptionPlaceholder')}
          disabled={actionQuery.isLoading}
        />

        <div>
          <TextArea
            label={t('projectActions.fields.inputSchema')}
            value={schemaText}
            onChange={(e) => setSchemaText(e.target.value)}
            rows={8}
            spellCheck={false}
            className="font-mono text-xs"
            disabled={actionQuery.isLoading}
          />
          <p className="mt-1.5 text-xs text-text-secondary">
            {t('projectActions.fields.inputSchemaHint')}
          </p>
        </div>

        <ToggleSwitch
          checked={enabled}
          onChange={setEnabled}
          disabled={actionQuery.isLoading}
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
