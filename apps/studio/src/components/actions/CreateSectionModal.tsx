import { FolderPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import SectionColorPicker from '@/components/actions/SectionColorPicker';
import BaseModal from '@/components/ui/BaseModal';
import InputField from '@/components/ui/InputField';
import TextArea from '@/components/ui/TextArea';
import { DEFAULT_SECTION_COLOR } from '@/constants/actions';
import { useCreateActionSection } from '@/hooks/use-action-sections';
import { useModalStore, type CreateSectionModalProps } from '@/stores/modal';
import { getApiErrorMessage } from '@/utils/statusMessage';

export default function CreateSectionModal() {
  const { t } = useTranslation();
  const currentModal = useModalStore((state) => state.currentModal);
  const modalProps = useModalStore((state) => state.modalProps);
  const closeModal = useModalStore((state) => state.closeModal);

  const isOpen = currentModal === 'createSection';
  const projectId = (modalProps as CreateSectionModalProps | null)?.projectId;

  const createSection = useCreateActionSection(projectId ?? null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>(DEFAULT_SECTION_COLOR);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setColor(DEFAULT_SECTION_COLOR);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t('projectActions.sections.errors.nameRequired'));
      return;
    }

    setError(null);
    try {
      await createSection.mutateAsync({
        name: trimmedName,
        description: description.trim() || undefined,
        color,
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
      title={t('projectActions.sections.create.title')}
      subtitle={t('projectActions.sections.create.subtitle')}
      icon={FolderPlus}
      maxWidth="max-w-md"
      primaryButton={{
        label: t('projectActions.sections.create.submit'),
        type: 'submit',
        form: 'create-section-form',
        loading: createSection.isPending,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <form
        id="create-section-form"
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
        />
        <SectionColorPicker
          label={t('projectActions.sections.fields.color')}
          value={color}
          onChange={setColor}
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
