import { Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ActionSchemaEditor,
  isSchemaEditorAdvancedLocked,
  schemaEditorValueFromInputSchema,
  type ActionSchemaEditorValue,
} from '@/components/actions/ActionSchemaEditor';
import { useSectionOptions } from '@/components/actions/use-section-options';
import BaseModal from '@/components/ui/BaseModal';
import CustomSelect from '@/components/ui/CustomSelect';
import InputField from '@/components/ui/InputField';
import TextArea from '@/components/ui/TextArea';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { useAction, useUpdateAction } from '@/hooks/use-actions';
import { useModalStore, type EditActionModalProps } from '@/stores/modal';
import { resolveInputSchema } from '@/utils/action-schema-builder';
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
  const sectionOptions = useSectionOptions(isOpen ? projectId : null);

  const [description, setDescription] = useState('');
  const [schemaEditor, setSchemaEditor] = useState<ActionSchemaEditorValue>(
    schemaEditorValueFromInputSchema({ type: 'object', properties: {} }),
  );
  const [advancedLocked, setAdvancedLocked] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [sectionId, setSectionId] = useState('');
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
      setSchemaEditor(schemaEditorValueFromInputSchema(action.inputSchema));
      setAdvancedLocked(isSchemaEditorAdvancedLocked(action.inputSchema));
      setEnabled(action.enabled);
      setSectionId(action.sectionId ?? '');
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

    const resolved = resolveInputSchema({
      advancedMode: schemaEditor.advancedMode,
      schemaText: schemaEditor.schemaText,
      fields: schemaEditor.fields,
    });

    if (!resolved.ok) {
      setError(
        resolved.error === 'invalidSchema'
          ? t('projectActions.errors.invalidSchema')
          : t(`projectActions.parameters.errors.${resolved.error}`),
      );
      return;
    }

    setError(null);
    try {
      await updateAction.mutateAsync({
        actionId,
        body: {
          description: description.trim() || undefined,
          inputSchema: resolved.value,
          enabled,
          sectionId: sectionId || null,
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
          placeholder={t('projectActions.fields.namePlaceholder')}
          disabled
        />

        <TextArea
          label={t('projectActions.fields.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('projectActions.fields.descriptionPlaceholder')}
          rows={3}
          disabled={actionQuery.isLoading}
        />

        <CustomSelect
          title={t('projectActions.fields.section')}
          options={sectionOptions}
          selectedOption={sectionId}
          onChange={setSectionId}
          disabled={actionQuery.isLoading}
          showIcon={false}
        />

        <ActionSchemaEditor
          value={schemaEditor}
          onChange={setSchemaEditor}
          disabled={actionQuery.isLoading}
          advancedLocked={advancedLocked}
        />

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
