import { LayoutGrid, Map } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/components/ui/BaseModal';
import InputField from '@/components/ui/InputField';
import TextArea from '@/components/ui/TextArea';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { ACTION_NAME_PATTERN } from '@/constants/actions';
import { useAppPages, useCreateAppPage } from '@/hooks/use-app-pages';
import { useFeatureModal } from '@/hooks/use-feature-modal';
import { toast } from '@/stores/toast';
import { getApiErrorMessage } from '@/utils/statusMessage';
import { buildChildPageFormDefaults } from '@/utils/app-layout-page-tree';
import {
  findRootContainerPage,
  isContainerPage,
  resolveDefaultParentPageId,
} from '@/utils/app-layout-root-page';

export default function CreateAppPageModal() {
  const { t } = useTranslation();
  const { isOpen, props, closeModal } = useFeatureModal('createAppPage');
  const projectId = props?.projectId;
  const parentPageId = props?.parentPageId;
  const pageKind = props?.pageKind ?? 'screen';
  const isContainerMode = pageKind === 'container';

  const pagesQuery = useAppPages(isOpen ? (projectId ?? null) : null);
  const parentPage = pagesQuery.data?.find((page) => page.id === parentPageId);
  const rootPage = findRootContainerPage(pagesQuery.data);
  const createPage = useCreateAppPage(projectId ?? null);

  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [route, setRoute] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDescription('');
    setEnabled(true);

    if (isContainerMode) {
      setSlug('');
      setTitle('');
      setRoute('');
      return;
    }

    if (parentPage && !isContainerPage(parentPage)) {
      const defaults = buildChildPageFormDefaults(parentPage);
      setSlug(defaults.slug);
      setTitle(defaults.title);
      setRoute(defaults.route);
      return;
    }

    setSlug('');
    setTitle('');
    setRoute('');
  }, [
    isOpen,
    isContainerMode,
    parentPageId,
    parentPage?.id,
    parentPage?.slug,
    parentPage?.title,
    parentPage?.route,
    rootPage?.id,
  ]);

  if (!isOpen) {
    return null;
  }

  const isExplicitChild = Boolean(parentPageId && parentPage);
  const isUnderRoot = !parentPageId && Boolean(rootPage) && !isContainerMode;

  const routePlaceholder = parentPage
    ? t('projectLayout.fields.routeChildPlaceholder', {
        route: parentPage.route,
      })
    : isContainerMode
      ? t('projectLayout.fields.routeContainerPlaceholder')
      : t('projectLayout.fields.routePlaceholder');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedSlug = slug.trim();
    const trimmedTitle = title.trim();
    const trimmedRoute = route.trim();
    const trimmedDescription = description.trim();

    if (!ACTION_NAME_PATTERN.test(trimmedSlug)) {
      toast.error(t('projectLayout.errors.invalidSlug'));
      return;
    }
    if (!trimmedTitle) {
      toast.error(t('projectLayout.errors.requiredFields'));
      return;
    }
    if (isContainerMode) {
      if (!trimmedDescription) {
        toast.error(t('projectLayout.errors.containerDescriptionRequired'));
        return;
      }
    } else if (!trimmedRoute) {
      toast.error(t('projectLayout.errors.requiredFields'));
      return;
    }

    try {
      await createPage.mutateAsync({
        slug: trimmedSlug,
        title: trimmedTitle,
        route: isContainerMode ? trimmedRoute || '/' : trimmedRoute,
        description: trimmedDescription || undefined,
        enabled,
        pageKind: isContainerMode ? 'container' : 'screen',
        parentPageId: resolveDefaultParentPageId(
          pagesQuery.data,
          parentPageId,
        ),
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

  const modalTitle = isContainerMode
    ? isExplicitChild
      ? t('projectLayout.create.containerChildTitle')
      : t('projectLayout.create.containerTitle')
    : isExplicitChild && parentPage && !isContainerPage(parentPage)
      ? t('projectLayout.create.childTitle')
      : t('projectLayout.create.title');

  const modalSubtitle = isContainerMode
    ? isExplicitChild && parentPage
      ? t('projectLayout.create.containerChildSubtitle', {
          title: parentPage.title,
        })
      : t('projectLayout.create.containerSubtitle')
    : isExplicitChild && parentPage && !isContainerPage(parentPage)
      ? t('projectLayout.create.childSubtitle', { title: parentPage.title })
      : isExplicitChild && parentPage && isContainerPage(parentPage)
        ? t('projectLayout.create.underRootSubtitle', {
            title: parentPage.title,
          })
        : isUnderRoot
          ? t('projectLayout.create.underRootSubtitle', {
              title: rootPage!.title,
            })
          : t('projectLayout.create.subtitle');

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={modalTitle}
      subtitle={modalSubtitle}
      icon={isContainerMode ? LayoutGrid : Map}
      maxWidth="max-w-lg"
      primaryButton={{
        label: isContainerMode
          ? t('projectLayout.create.containerSubmit')
          : t('projectLayout.create.submit'),
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
          placeholder={
            isContainerMode
              ? t('projectLayout.fields.slugContainerPlaceholder')
              : t('projectLayout.fields.slugPlaceholder')
          }
          autoFocus
        />
        <p className="text-xs text-text-secondary">
          {t('projectLayout.fields.slugHint')}
        </p>
        <InputField
          label={t('projectLayout.fields.title')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            isContainerMode
              ? t('projectLayout.fields.titleContainerPlaceholder')
              : t('projectLayout.fields.titlePlaceholder')
          }
        />
        <InputField
          label={t('projectLayout.fields.route')}
          value={route}
          onChange={(e) => setRoute(e.target.value)}
          placeholder={routePlaceholder}
        />
        {isUnderRoot ? (
          <p className="text-xs text-text-secondary">
            {t('projectLayout.create.underRootHint')}
          </p>
        ) : null}
        {parentPage && !isContainerPage(parentPage) && !isContainerMode ? (
          <p className="text-xs text-text-secondary">
            {t('projectLayout.fields.routeChildHint', {
              route: parentPage.route,
            })}
          </p>
        ) : null}
        <TextArea
          label={t('projectLayout.fields.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={
            isContainerMode
              ? t('projectLayout.fields.descriptionContainerPlaceholder')
              : t('projectLayout.fields.descriptionPlaceholder')
          }
          rows={3}
        />
        {isContainerMode ? (
          <p className="text-xs text-text-secondary">
            {t('projectLayout.fields.descriptionContainerHint')}
          </p>
        ) : null}
        <ToggleSwitch
          checked={enabled}
          onChange={setEnabled}
          label={t('projectLayout.fields.enabled')}
        />
      </form>
    </BaseModal>
  );
}
