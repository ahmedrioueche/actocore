import { Link, useParams } from '@tanstack/react-router';
import { RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { KnowledgeChunksTable } from '@/components/knowledge/KnowledgeChunksTable';
import { KnowledgePagesField } from '@/components/knowledge/KnowledgePagesField';
import { PageHeader } from '@/components/layout/PageHeader';
import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import {
  useKnowledgeSource,
  useReindexKnowledge,
  useUpdateKnowledge,
} from '@/hooks/use-knowledge';
import { useProject } from '@/hooks/use-projects';
import { canWriteKnowledge } from '@/lib/studio-permissions';
import { toast } from '@/stores/toast';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

export default function ProjectKnowledgeDetailPage() {
  const { t } = useTranslation();
  const { projectId, sourceId } = useParams({ strict: false });
  const { session } = useAuth();

  const projectQuery = useProject(projectId ?? null);
  const sourceQuery = useKnowledgeSource(projectId ?? null, sourceId ?? null);
  const updateKnowledge = useUpdateKnowledge(projectId ?? null);
  const reindexKnowledge = useReindexKnowledge(projectId ?? null);

  const canWrite = canWriteKnowledge(session);
  const source = sourceQuery.data;
  const projectName = projectQuery.data?.name;

  const [pageIds, setPageIds] = useState<string[]>([]);
  const [pagesDirty, setPagesDirty] = useState(false);
  const seededRef = useRef(false);

  useEffect(() => {
    seededRef.current = false;
  }, [sourceId]);

  useEffect(() => {
    if (source && !seededRef.current) {
      setPageIds(source.pageIds ?? []);
      setPagesDirty(false);
      seededRef.current = true;
    }
  }, [source]);

  const handleSavePages = async () => {
    if (!sourceId) {
      return;
    }
    try {
      await updateKnowledge.mutateAsync({ sourceId, pageIds });
      setPagesDirty(false);
    } catch (err) {
      toast.error(getUnknownApiErrorMessage(t, err));
    }
  };

  const handleReindex = async () => {
    if (!sourceId) {
      return;
    }
    try {
      await reindexKnowledge.mutateAsync(sourceId);
    } catch (err) {
      toast.error(getUnknownApiErrorMessage(t, err));
    }
  };

  const canReindex =
    canWrite &&
    source &&
    source.status !== 'pending' &&
    source.status !== 'indexing';

  return (
    <>
      <div className="mb-4">
        {projectId ? (
          <Link
            to="/projects/$projectId/knowledge"
            params={{ projectId }}
            className="inline-block"
          >
            <BackButton />
          </Link>
        ) : (
          <BackButton />
        )}
      </div>

      <PageHeader
        title={source?.title ?? t('knowledge.detail.title')}
        subtitle={
          projectName
            ? t('projectPages.sectionSubtitle', { project: projectName })
            : undefined
        }
        actions={
          canReindex && sourceId ? (
            <Button
              variant="outline"
              color="secondary"
              icon={<RefreshCw className="h-4 w-4" />}
              disabled={reindexKnowledge.isPending}
              onClick={() => void handleReindex()}
            >
              {reindexKnowledge.isPending
                ? t('knowledge.detail.reindexing')
                : t('knowledge.detail.reindex')}
            </Button>
          ) : null
        }
      />

      {source?.errorMessage ? (
        <p className="mb-4 text-sm text-danger">{source.errorMessage}</p>
      ) : null}

      <div className="space-y-8">
        {canWrite && projectId ? (
          <Card className="border-primary">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-text-primary">
                {t('knowledge.detail.pagesTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <KnowledgePagesField
                projectId={projectId}
                value={pageIds}
                onChange={(next) => {
                  setPageIds(next);
                  setPagesDirty(true);
                }}
                disabled={updateKnowledge.isPending}
              />
              <Button
                disabled={!pagesDirty || updateKnowledge.isPending}
                onClick={() => void handleSavePages()}
              >
                {updateKnowledge.isPending
                  ? t('knowledge.detail.savingPages')
                  : t('knowledge.detail.savePages')}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {projectId && sourceId ? (
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {t('knowledge.detail.chunksTitle')}
              </h2>
              <p className="text-sm text-text-secondary">
                {t('knowledge.detail.chunksSubtitle', {
                  count: source?.chunkCount ?? 0,
                })}
              </p>
            </div>
            <KnowledgeChunksTable projectId={projectId} sourceId={sourceId} />
          </div>
        ) : null}
      </div>
    </>
  );
}
