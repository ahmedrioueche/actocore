import { Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/components/ui/BaseModal';
import CustomSelect from '@/components/ui/CustomSelect';
import InputField from '@/components/ui/InputField';
import TextArea from '@/components/ui/TextArea';
import { useProjectActions } from '@/hooks/use-actions';
import {
  useAppPages,
  useUpdateAppPageFunctionality,
} from '@/hooks/use-app-pages';
import { useFeatureModal } from '@/hooks/use-feature-modal';
import { toast } from '@/stores/toast';
import { getApiErrorMessage } from '@/utils/statusMessage';

export default function EditAppPageFunctionalityModal() {
  const { t } = useTranslation();
  const { isOpen, props, closeModal } = useFeatureModal('editAppPageFunctionality');
  const projectId = props?.projectId ?? null;
  const pageId = props?.pageId ?? null;
  const functionalityId = props?.functionalityId ?? null;

  const pagesQuery = useAppPages(isOpen ? projectId : null);
  const page = pagesQuery.data?.find((entry) => entry.id === pageId);
  const functionality = page?.functionalities?.find(
    (entry) => entry.id === functionalityId,
  );

  const updateFunctionality = useUpdateAppPageFunctionality(projectId);
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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkedActionId, setLinkedActionId] = useState('');

  useEffect(() => {
    if (isOpen && functionality) {
      setTitle(functionality.title);
      setDescription(functionality.description ?? '');
      setLinkedActionId(functionality.linkedActionId ?? '');
    }
  }, [functionality, isOpen]);

  if (!isOpen || !projectId || !pageId || !functionalityId || !functionality) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error(t('projectLayout.functionalities.errors.requiredTitle'));
      return;
    }

    try {
      await updateFunctionality.mutateAsync({
        pageId,
        functionalityId,
        body: {
          title: trimmedTitle,
          description: description.trim() || undefined,
          linkedActionId: linkedActionId || null,
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
      title={t('projectLayout.functionalities.edit.title')}
      subtitle={t('projectLayout.functionalities.edit.subtitle')}
      icon={Sparkles}
      primaryButton={{
        label: t('projectLayout.functionalities.edit.submit'),
        type: 'submit',
        form: 'edit-app-page-functionality-form',
        loading: updateFunctionality.isPending,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
      }}
    >
      <form
        id="edit-app-page-functionality-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
        <InputField
          label={t('projectLayout.functionalities.fields.id')}
          value={functionality.id}
          disabled
        />
        <InputField
          label={t('projectLayout.functionalities.fields.title')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <TextArea
          label={t('projectLayout.functionalities.fields.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
