import { Sparkles, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ActionSchemaEditor,
  createInitialSchemaEditorValue,
  type ActionSchemaEditorValue,
} from '@/components/actions/ActionSchemaEditor';
import { ActionCreateStepProgress } from '@/components/actions/ActionCreateStepProgress';
import { ActionPagesField } from '@/components/actions/ActionPagesField';
import { useSectionOptions } from '@/components/actions/use-section-options';
import BaseModal from '@/components/ui/BaseModal';
import CustomSelect from '@/components/ui/CustomSelect';
import InputField from '@/components/ui/InputField';
import TextArea from '@/components/ui/TextArea';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { ACTION_NAME_PATTERN } from '@/constants/actions';
import { useCreateAction } from '@/hooks/use-actions';
import { useModalStore, type CreateActionModalProps } from '@/stores/modal';
import {
  resolveInputSchema,
  suggestActionNameFromDescription,
} from '@/utils/action-schema-builder';
import { toast } from '@/stores/toast';
import { getApiErrorMessage } from '@/utils/statusMessage';

export default function CreateActionModal() {
  const { t } = useTranslation();
  const currentModal = useModalStore((state) => state.currentModal);
  const modalProps = useModalStore((state) => state.modalProps);
  const openModal = useModalStore((state) => state.openModal);
  const closeModal = useModalStore((state) => state.closeModal);

  const isOpen = currentModal === 'createAction';
  const props = modalProps as CreateActionModalProps | null;
  const projectId = props?.projectId;

  const createAction = useCreateAction(projectId ?? null);
  const sectionOptions = useSectionOptions(isOpen ? (projectId ?? null) : null);

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [pageIds, setPageIds] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [schemaEditor, setSchemaEditor] = useState<ActionSchemaEditorValue>(
    createInitialSchemaEditorValue('no_params'),
  );

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setName('');
      setDescription('');
      setSectionId(props?.defaultSectionId ?? '');
      setPageIds([]);
      setEnabled(true);
      setSchemaEditor(createInitialSchemaEditorValue('no_params'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSuggestName = () => {
    const suggested = suggestActionNameFromDescription(description);
    if (suggested) {
      setName(suggested);
    }
  };

  const validateStep1 = (): boolean => {
    const trimmedName = name.trim();
    if (!ACTION_NAME_PATTERN.test(trimmedName)) {
      toast.error(t('projectActions.errors.invalidName'));
      return false;
    }
    return true;
  };

  const goToStep2 = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      goToStep2();
      return;
    }
    void handleSubmit(e);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep1()) {
      setStep(1);
      return;
    }

    const resolved = resolveInputSchema({
      advancedMode: schemaEditor.advancedMode,
      schemaText: schemaEditor.schemaText,
      fields: schemaEditor.fields,
    });

    if (!resolved.ok) {
      toast.error(
        resolved.error === 'invalidSchema'
          ? t('projectActions.errors.invalidSchema')
          : t(`projectActions.parameters.errors.${resolved.error}`),
      );
      return;
    }

    try {
      await createAction.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        inputSchema: resolved.value,
        enabled,
        sectionId: sectionId || null,
        pageIds: pageIds.length > 0 ? pageIds : undefined,
      });

      const parameters = schemaEditor.advancedMode
        ? []
        : schemaEditor.fields
            .filter((field) => field.name.trim())
            .map((field) => ({
              name: field.name.trim(),
              type: field.type,
            }));

      openModal('actionCreated', {
        actionName: name.trim(),
        parameters,
      });
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

  const stepTitle =
    step === 1
      ? t('projectActions.create.step1Title')
      : t('projectActions.create.step2Title');

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={stepTitle}
      subtitle={t('projectActions.create.subtitle')}
      icon={Zap}
      maxWidth="max-w-lg"
      primaryButton={{
        label:
          step === 1
            ? t('projectActions.create.next')
            : t('projectActions.create.submit'),
        type: 'submit',
        form: 'create-action-form',
        loading: step === 2 ? createAction.isPending : false,
      }}
      tertiaryButton={
        step === 2
          ? {
              label: t('projectActions.create.back'),
              onClick: () => {
                setStep(1);
              },
              variant: 'ghost',
            }
          : undefined
      }
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <div className="mb-5">
        <ActionCreateStepProgress step={step} />
      </div>

      <form
        id="create-action-form"
        onSubmit={handleFormSubmit}
        className="space-y-4"
      >
        {step === 1 ? (
          <>
            <div className="rounded-xl border border-border bg-surface-secondary px-4 py-3 text-sm text-text-secondary">
              <p className="font-medium text-text-primary">
                {t('projectActions.create.howItWorks.title')}
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>{t('projectActions.create.howItWorks.studio')}</li>
                <li>{t('projectActions.create.howItWorks.ai')}</li>
                <li>{t('projectActions.create.howItWorks.sdk')}</li>
              </ul>
            </div>

            <div>
              <InputField
                label={t('projectActions.fields.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('projectActions.fields.namePlaceholder')}
                autoFocus
                rightIcon={
                  <button
                    type="button"
                    onClick={handleSuggestName}
                    className="p-1 text-text-secondary transition-colors duration-200 hover:text-text-primary"
                    title={t('projectActions.create.suggestName')}
                    aria-label={t('projectActions.create.suggestName')}
                  >
                    <Sparkles className="h-5 w-5" />
                  </button>
                }
              />
              <p className="mt-1.5 text-xs text-text-secondary">
                {t('projectActions.fields.nameHint')}
              </p>
            </div>

            <TextArea
              label={t('projectActions.fields.description')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('projectActions.fields.descriptionPlaceholder')}
              rows={3}
            />

            <CustomSelect
              title={t('projectActions.fields.section')}
              options={sectionOptions}
              selectedOption={sectionId}
              onChange={setSectionId}
              showIcon={false}
            />

            <ActionPagesField
              projectId={projectId ?? null}
              value={pageIds}
              onChange={setPageIds}
            />
          </>
        ) : (
          <>
            <ActionSchemaEditor
              value={schemaEditor}
              onChange={setSchemaEditor}
            />

            <ToggleSwitch
              checked={enabled}
              onChange={setEnabled}
              label={t('projectActions.fields.enabled')}
            />
          </>
        )}

      </form>
    </BaseModal>
  );
}
