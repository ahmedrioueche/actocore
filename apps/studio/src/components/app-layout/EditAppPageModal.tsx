import type { ActionData } from '@ahmedrioueche/actocore-shared';
import { Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AssignActionsPanel } from '@/components/app-layout/AssignActionsPanel';
import BaseModal from '@/components/ui/BaseModal';
import InputField from '@/components/ui/InputField';
import TextArea from '@/components/ui/TextArea';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { useProjectActions } from '@/hooks/use-actions';
import {
  useAppPages,
  useAssignAppPageActions,
  useUpdateAppPage,
} from '@/hooks/use-app-pages';
import { useModalStore, type EditAppPageModalProps } from '@/stores/modal';
import { toast } from '@/stores/toast';
import { getApiErrorMessage } from '@/utils/statusMessage';

export default function EditAppPageModal() {
  const { t } = useTranslation();
  const currentModal = useModalStore((state) => state.currentModal);
  const modalProps = useModalStore((state) => state.modalProps);
  const closeModal = useModalStore((state) => state.closeModal);

  const isOpen = currentModal === 'editAppPage';
  const props = modalProps as EditAppPageModalProps | null;
  const projectId = props?.projectId ?? null;
  const pageId = props?.pageId ?? null;

  const pagesQuery = useAppPages(isOpen ? projectId : null);
  const page = pagesQuery.data?.find((entry) => entry.id === pageId);
  const updatePage = useUpdateAppPage(projectId);
  const assignActions = useAssignAppPageActions(projectId);
  const actionsQuery = useProjectActions(isOpen ? projectId : null, {
    page: 1,
    limit: 200,
  });
  const allActions = actionsQuery.data?.items ?? [];

  const [title, setTitle] = useState('');
  const [route, setRoute] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const seededRef = useRef(false);
  const actionsSeededRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      seededRef.current = false;
      actionsSeededRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && page && !seededRef.current) {
      setTitle(page.title);
      setRoute(page.route);
      setDescription(page.description ?? '');
      setEnabled(page.enabled);
      seededRef.current = true;
    }
  }, [isOpen, page]);

  useEffect(() => {
    if (
      !isOpen ||
      !pageId ||
      actionsSeededRef.current ||
      actionsQuery.isLoading
    ) {
      return;
    }
    const linked = allActions
      .filter((action) => action.pageIds?.includes(pageId))
      .map((action) => action.id);
    setSelectedActionIds(linked);
    actionsSeededRef.current = true;
  }, [actionsQuery.isLoading, allActions, isOpen, pageId]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageId) {
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedRoute = route.trim();
    if (!trimmedTitle || !trimmedRoute) {
      toast.error(t('projectLayout.errors.requiredFields'));
      return;
    }

    try {
      await updatePage.mutateAsync({
        pageId,
        body: {
          title: trimmedTitle,
          route: trimmedRoute,
          description: description.trim() || undefined,
          enabled,
        },
      });
      await assignActions.mutateAsync({
        pageId,
        body: { actionIds: selectedActionIds },
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

  const isSaving = updatePage.isPending || assignActions.isPending;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={t('projectLayout.edit.title')}
      subtitle={page?.title ?? t('projectLayout.edit.subtitle')}
      icon={Pencil}
      maxWidth="max-w-2xl"
      primaryButton={{
        label: t('projectLayout.edit.submit'),
        type: 'submit',
        form: 'edit-app-page-form',
        loading: isSaving,
        disabled: pagesQuery.isLoading,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <form
        id="edit-app-page-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
        <InputField
          label={t('projectLayout.fields.slug')}
          value={page?.slug ?? ''}
          onChange={() => undefined}
          disabled
        />
        <p className="text-xs text-text-secondary">
          {t('projectLayout.fields.slugImmutable')}
        </p>
        <InputField
          label={t('projectLayout.fields.title')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('projectLayout.fields.titlePlaceholder')}
          disabled={pagesQuery.isLoading}
        />
        <InputField
          label={t('projectLayout.fields.route')}
          value={route}
          onChange={(e) => setRoute(e.target.value)}
          placeholder={t('projectLayout.fields.routePlaceholder')}
          disabled={pagesQuery.isLoading}
        />
        <TextArea
          label={t('projectLayout.fields.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('projectLayout.fields.descriptionPlaceholder')}
          rows={3}
          disabled={pagesQuery.isLoading}
        />
        <ToggleSwitch
          checked={enabled}
          onChange={setEnabled}
          disabled={pagesQuery.isLoading}
          label={t('projectLayout.fields.enabled')}
        />

        <AssignActionsPanel
          actions={allActions as ActionData[]}
          selectedActionIds={selectedActionIds}
          onChange={setSelectedActionIds}
          disabled={pagesQuery.isLoading || actionsQuery.isLoading}
        />

      </form>
    </BaseModal>
  );
}
