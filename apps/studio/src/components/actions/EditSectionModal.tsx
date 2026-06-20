import { Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import SectionColorPicker from '@/components/actions/SectionColorPicker';
import BaseModal from '@/components/ui/BaseModal';
import InputField from '@/components/ui/InputField';
import TextArea from '@/components/ui/TextArea';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { DEFAULT_SECTION_COLOR } from '@/constants/actions';
import {
  useActionSections,
  useUpdateActionSection,
} from '@/hooks/use-action-sections';
import { useFeatureModal } from '@/hooks/use-feature-modal';
import { useModalStore, type EditSectionModalProps  } from '@/stores/modal';
import { toast } from '@/stores/toast';
import { getApiErrorMessage } from '@/utils/statusMessage';

export default function EditSectionModal() {
  const { t } = useTranslation();
  const { isOpen, props, closeModal } = useFeatureModal('editSection');
  const projectId = props?.projectId ?? null;
  const sectionId = props?.sectionId ?? null;

  const sectionsQuery = useActionSections(isOpen ? projectId : null);
  const section = sectionsQuery.data?.find((s) => s.id === sectionId);
  const updateSection = useUpdateActionSection(projectId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>(DEFAULT_SECTION_COLOR);
  const [enabled, setEnabled] = useState(true);
  const seededRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      seededRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && section && !seededRef.current) {
      setName(section.name);
      setDescription(section.description ?? '');
      setColor(section.color ?? DEFAULT_SECTION_COLOR);
      setEnabled(section.enabled);
      seededRef.current = true;
    }
  }, [isOpen, section]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionId) {
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error(t('projectActions.sections.errors.nameRequired'));
      return;
    }

    try {
      await updateSection.mutateAsync({
        sectionId,
        body: {
          name: trimmedName,
          description: description.trim() || undefined,
          color,
          enabled,
        },
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
      title={t('projectActions.sections.edit.title')}
      subtitle={section?.name ?? t('projectActions.sections.edit.subtitle')}
      icon={Pencil}
      maxWidth="max-w-md"
      primaryButton={{
        label: t('projectActions.sections.edit.submit'),
        type: 'submit',
        form: 'edit-section-form',
        loading: updateSection.isPending,
        disabled: sectionsQuery.isLoading,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <form
        id="edit-section-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
        <InputField
          label={t('projectActions.sections.fields.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('projectActions.sections.fields.namePlaceholder')}
          autoFocus
        />
        <TextArea
          label={t('projectActions.sections.fields.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t(
            'projectActions.sections.fields.descriptionPlaceholder',
          )}
          rows={3}
          disabled={sectionsQuery.isLoading}
        />
        <SectionColorPicker
          label={t('projectActions.sections.fields.color')}
          value={color}
          onChange={setColor}
        />
        <ToggleSwitch
          checked={enabled}
          onChange={setEnabled}
          label={t('projectActions.sections.fields.enabled')}
        />
        <p className="text-xs text-text-secondary">
          {t('projectActions.sections.fields.enabledHint')}
        </p>
      </form>
    </BaseModal>
  );
}
