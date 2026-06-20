import { Download } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { buildAppLayoutExport } from '@ahmedrioueche/actocore-shared';

import BaseModal from '@/components/ui/BaseModal';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { useProjectActions } from '@/hooks/use-actions';
import { useAppPageLinks } from '@/hooks/use-app-page-links';
import { useAppPages } from '@/hooks/use-app-pages';
import { useFeatureModal } from '@/hooks/use-feature-modal';
import { useProject } from '@/hooks/use-projects';
import { toast } from '@/stores/toast';
import {
  buildAppLayoutExportFilename,
  downloadAppLayoutJson,
} from '@/utils/app-layout-export-file';

export default function ExportAppLayoutModal() {
  const { t } = useTranslation();
  const { isOpen, props, closeModal } = useFeatureModal('exportAppLayout');
  const projectId = props?.projectId ?? null;

  const [includeActionAssignments, setIncludeActionAssignments] = useState(false);

  const projectQuery = useProject(projectId);
  const pagesQuery = useAppPages(isOpen ? projectId : null);
  const linksQuery = useAppPageLinks(isOpen ? projectId : null);
  const actionsQuery = useProjectActions(isOpen ? projectId : null, {
    page: 1,
    limit: 500,
  });

  if (!isOpen || !projectId) {
    return null;
  }

  const pages = pagesQuery.data ?? [];
  const links = linksQuery.data ?? [];
  const actions = actionsQuery.data?.items ?? [];
  const isLoading =
    pagesQuery.isLoading || linksQuery.isLoading || actionsQuery.isLoading;

  const handleExport = () => {
    const layout = buildAppLayoutExport(pages, links, actions, {
      includeActionAssignments,
    });
    downloadAppLayoutJson(
      layout,
      buildAppLayoutExportFilename(projectQuery.data?.name),
    );
    toast.success(t('projectLayout.export.success'));
    closeModal();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={t('projectLayout.export.title')}
      subtitle={t('projectLayout.export.subtitle', {
        pages: pages.length,
        links: links.length,
      })}
      icon={Download}
      maxWidth="max-w-lg"
      primaryButton={{
        label: t('projectLayout.export.submit'),
        onClick: handleExport,
        loading: isLoading,
        disabled: isLoading || pages.length === 0,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
      }}
    >
      <p className="mb-4 text-sm text-text-secondary">
        {t('projectLayout.export.description')}
      </p>
      <ToggleSwitch
        checked={includeActionAssignments}
        onChange={setIncludeActionAssignments}
        disabled={isLoading}
        label={t('projectLayout.export.includeActions')}
      />
    </BaseModal>
  );
}
