import { Map } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/components/ui/BaseModal';
import InputField from '@/components/ui/InputField';
import TextArea from '@/components/ui/TextArea';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { ACTION_NAME_PATTERN } from '@/constants/actions';
import { useCreateAppPage } from '@/hooks/use-app-pages';
import { useFeatureModal } from '@/hooks/use-feature-modal';
import { useModalStore, type CreateAppPageModalProps  } from '@/stores/modal';
import { toast } from '@/stores/toast';
import { getApiErrorMessage } from '@/utils/statusMessage';

export default function CreateAppPageModal() {
  const { t } = useTranslation();
  const { isOpen, props, closeModal } = useFeatureModal('createAppPage');
  const projectId = props?.projectId;

  const createPage = useCreateAppPage(projectId ?? null);

  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [route, setRoute] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setSlug('');
      setTitle('');
      setRoute('');
      setDescription('');
      setEnabled(true);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedSlug = slug.trim();
    const trimmedTitle = title.trim();
    const trimmedRoute = route.trim();

    if (!ACTION_NAME_PATTERN.test(trimmedSlug)) {
      toast.error(t('projectLayout.errors.invalidSlug'));
      return;
    }
    if (!trimmedTitle || !trimmedRoute) {
      toast.error(t('projectLayout.errors.requiredFields'));
      return;
    }

    try {
      await createPage.mutateAsync({
        slug: trimmedSlug,
        title: trimmedTitle,
        route: trimmedRoute,
        description: description.trim() || undefined,
        enabled,
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
      title={t('projectLayout.create.title')}
      subtitle={t('projectLayout.create.subtitle')}
      icon={Map}
      maxWidth="max-w-lg"
      primaryButton={{
        label: t('projectLayout.create.submit'),
        type: 'submit',
        form: 'create-app-page-form',
        loading: createPage.isPending,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <form
        id="create-app-page-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
        <InputField
          label={t('projectLayout.fields.slug')}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={t('projectLayout.fields.slugPlaceholder')}
          autoFocus
        />
        <p className="text-xs text-text-secondary">
          {t('projectLayout.fields.slugHint')}
        </p>
        <InputField
          label={t('projectLayout.fields.title')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('projectLayout.fields.titlePlaceholder')}
        />
        <InputField
          label={t('projectLayout.fields.route')}
          value={route}
          onChange={(e) => setRoute(e.target.value)}
          placeholder={t('projectLayout.fields.routePlaceholder')}
        />
        <TextArea
          label={t('projectLayout.fields.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('projectLayout.fields.descriptionPlaceholder')}
          rows={3}
        />
        <ToggleSwitch
          checked={enabled}
          onChange={setEnabled}
          label={t('projectLayout.fields.enabled')}
        />
      </form>
    </BaseModal>
  );
}
