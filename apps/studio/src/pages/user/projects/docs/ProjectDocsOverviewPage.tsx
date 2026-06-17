import {
  BookOpen,
  KeyRound,
  Map,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { DocStepLink } from '@/components/projects/DocStepLink';
import Tip from '@/components/ui/Tip';
import { useParams } from '@tanstack/react-router';

export default function ProjectDocsOverviewPage() {
  const { t } = useTranslation();
  const { projectId } = useParams({ strict: false });

  if (!projectId) {
    return null;
  }

  const routeParams = { projectId };

  return (
    <div className="space-y-8">
      <Tip title={t('projectDocs.gettingStarted.title')}>
        <p>{t('projectDocs.gettingStarted.body')}</p>
      </Tip>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {t('projectDocs.setup.title')}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {t('projectDocs.setup.description')}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <DocStepLink
            step={1}
            to="/projects/$projectId/api-keys"
            params={routeParams}
            icon={KeyRound}
            title={t('nav.project.apiKeys')}
            description={t('projectDocs.setup.apiKeys')}
          />
          <DocStepLink
            step={2}
            to="/projects/$projectId/knowledge"
            params={routeParams}
            icon={BookOpen}
            title={t('nav.project.knowledge')}
            description={t('projectDocs.setup.knowledge')}
          />
          <DocStepLink
            step={3}
            to="/projects/$projectId/actions"
            params={routeParams}
            icon={Zap}
            title={t('nav.project.actions')}
            description={t('projectDocs.setup.actions')}
          />
          <DocStepLink
            step={4}
            to="/projects/$projectId/layout"
            params={routeParams}
            icon={Map}
            title={t('nav.project.layout')}
            description={t('projectDocs.setup.appLayout')}
          />
          <DocStepLink
            step={5}
            to="/projects/$projectId/sdk-config"
            params={routeParams}
            icon={SlidersHorizontal}
            title={t('nav.project.sdkConfig')}
            description={t('projectDocs.setup.sdkConfig')}
          />
        </div>
      </section>
    </div>
  );
}
