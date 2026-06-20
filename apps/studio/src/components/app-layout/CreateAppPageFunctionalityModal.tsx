import { Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/components/ui/BaseModal';
import CustomSelect from '@/components/ui/CustomSelect';
import InputField from '@/components/ui/InputField';
import TextArea from '@/components/ui/TextArea';
import { ACTION_NAME_PATTERN } from '@/constants/actions';
import { useProjectActions } from '@/hooks/use-actions';
import { useCreateAppPageFunctionality } from '@/hooks/use-app-pages';
import {
  useModalStore,
  type CreateAppPageFunctionalityModalProps,
} from '@/stores/modal';
import { toast } from '@/stores/toast';
import { getApiErrorMessage } from '@/utils/statusMessage';

export default function CreateAppPageFunctionalityModal() {
  const { t } = useTranslation();
  const currentModal = useModalStore((state) => state.currentModal);
  const modalProps = useModalStore((state) => state.modalProps);
  const closeModal = useModalStore((state) => state.closeModal);

  const isOpen = currentModal === 'createAppPageFunctionality';
  const props = modalProps as CreateAppPageFunctionalityModalProps | null;
  const projectId = props?.projectId ?? null;
  const pageId = props?.pageId ?? null;

  const createFunctionality = useCreateAppPageFunctionality(projectId);
  const actionsQuery = useProjectActions(isOpen ? projectId : null, {
    page: 1,
    limit: 200,
  });
  const actions = actionsQuery.data?.items ?? [];

  const actionOptions = useMemo(
    () => [
      {
        value: '',
        label: t('projectLayout.functionalities.fields.linkedActionEmpty'),
      },
      ...actions.map((action) => ({
        value: action.id,
        label: action.name,
      })),
    ],
    [actions, t],
  );

  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkedActionId, setLinkedActionId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setId('');
      setTitle('');
      setDescription('');
      setLinkedActionId('');
    }
  }, [isOpen]);

  if (!isOpen || !projectId || !pageId) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = id.trim();
    const trimmedTitle = title.trim();

    if (!ACTION_NAME_PATTERN.test(trimmedId)) {
      toast.error(t('projectLayout.functionalities.errors.invalidId'));
      return;
    }
    if (!trimmedTitle) {
      toast.error(t('projectLayout.functionalities.errors.requiredTitle'));
      return;
    }

    try {
      await createFunctionality.mutateAsync({
        pageId,
        body: {
          id: trimmedId,
          title: trimmedTitle,
          description: description.trim() || undefined,
          linkedActionId: linkedActionId || undefined,
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
      title={t('projectLayout.functionalities.create.title')}
      subtitle={t('projectLayout.functionalities.create.subtitle')}
      icon={Sparkles}
      primaryButton={{
        label: t('projectLayout.functionalities.create.submit'),
        type: 'submit',
        form: 'create-app-page-functionality-form',
        loading: createFunctionality.isPending,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
      }}
    >
      <form
        id="create-app-page-functionality-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
        <InputField
          label={t('projectLayout.functionalities.fields.id')}
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder={t('projectLayout.functionalities.fields.idPlaceholder')}
          required
        />
        <p className="text-xs text-text-secondary">
          {t('projectLayout.functionalities.fields.idHint')}
        </p>
        <InputField
          label={t('projectLayout.functionalities.fields.title')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('projectLayout.functionalities.fields.titlePlaceholder')}
          required
        />
        <TextArea
          label={t('projectLayout.functionalities.fields.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t(
            'projectLayout.functionalities.fields.descriptionPlaceholder',
          )}
          rows={3}
        />
        <CustomSelect
          title={t('projectLayout.functionalities.fields.linkedAction')}
          options={actionOptions}
          selectedOption={linkedActionId}
          onChange={setLinkedActionId}
          showIcon={false}
          searchable={actions.length > 10}
        />
      </form>
    </BaseModal>
  );
}
