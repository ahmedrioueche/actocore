import { useNavigate } from '@tanstack/react-router';
import { FolderPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/components/ui/BaseModal';
import InputField from '@/components/ui/InputField';
import { useCreateProject } from '@/hooks/use-projects';
import { useModalStore } from '@/stores/modal';
import { toast } from '@/stores/toast';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

export default function CreateProjectModal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentModal = useModalStore((state) => state.currentModal);
  const closeModal = useModalStore((state) => state.closeModal);

  const isOpen = currentModal === 'createProject';
  const createProject = useCreateProject();

  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error(t('projects.create.nameRequired'));
      return;
    }

    try {
      const project = await createProject.mutateAsync(trimmedName);
      closeModal();
      void navigate({
        to: '/projects/$projectId',
        params: { projectId: project.id },
      });
    } catch (err) {
      toast.error(getUnknownApiErrorMessage(t, err));
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={t('projects.create.title')}
      subtitle={t('projects.create.subtitle')}
      icon={FolderPlus}
      maxWidth="max-w-md"
      primaryButton={{
        label: t('projects.create.submit'),
        type: 'submit',
        form: 'create-project-form',
        loading: createProject.isPending,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <form
        id="create-project-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
        <InputField
          label={t('projectPages.fields.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('projects.create.namePlaceholder')}
          autoFocus
        />
      </form>
    </BaseModal>
  );
}
