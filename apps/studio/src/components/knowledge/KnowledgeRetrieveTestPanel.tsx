import type { KnowledgeRetrieveTestResult } from '@ahmedrioueche/actocore-shared';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import CustomSelect from '@/components/ui/CustomSelect';
import InputField from '@/components/ui/InputField';
import Button from '@/components/ui/Button';
import { useAppPages } from '@/hooks/use-app-pages';
import { useRetrieveTestKnowledge } from '@/hooks/use-knowledge';
import { toast } from '@/stores/toast';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

interface KnowledgeRetrieveTestPanelProps {
  projectId: string;
}

export function KnowledgeRetrieveTestPanel({
  projectId,
}: KnowledgeRetrieveTestPanelProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [currentPageId, setCurrentPageId] = useState('');
  const [result, setResult] = useState<KnowledgeRetrieveTestResult | null>(
    null,
  );

  const pagesQuery = useAppPages(projectId);
  const retrieveTest = useRetrieveTestKnowledge(projectId);

  const pageOptions = useMemo(() => {
    const options = [
      {
        value: '',
        label: t('knowledge.retrieveTest.allPages'),
      },
    ];
    for (const page of pagesQuery.data ?? []) {
      options.push({
        value: page.id,
        label: `${page.title} (${page.slug})`,
      });
    }
    return options;
  }, [pagesQuery.data, t]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      toast.error(t('knowledge.retrieveTest.errors.required'));
      return;
    }

    try {
      const data = await retrieveTest.mutateAsync({
        query: trimmed,
        currentPageId: currentPageId || undefined,
      });
      setResult(data);
    } catch (err) {
      setResult(null);
      toast.error(getUnknownApiErrorMessage(t, err));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('knowledge.retrieveTest.title')}</CardTitle>
        <p className="text-sm text-text-secondary">
          {t('knowledge.retrieveTest.subtitle')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <InputField
            label={t('knowledge.retrieveTest.queryLabel')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('knowledge.retrieveTest.queryPlaceholder')}
          />
          <CustomSelect
            title={t('knowledge.retrieveTest.pageLabel')}
            options={pageOptions}
            selectedOption={currentPageId}
            onChange={setCurrentPageId}
            showIcon={false}
          />
          <Button
            type="submit"
            icon={<Search className="h-4 w-4" />}
            disabled={retrieveTest.isPending}
          >
            {retrieveTest.isPending
              ? t('knowledge.retrieveTest.running')
              : t('knowledge.retrieveTest.submit')}
          </Button>
        </form>

        {result ? (
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
              <span>
                {t('knowledge.retrieveTest.candidates', {
                  count: result.retrievalLog.candidateCount,
                })}
              </span>
              {result.retrievalLog.topScore != null ? (
                <span>
                  {t('knowledge.retrieveTest.topScore', {
                    score: result.retrievalLog.topScore.toFixed(4),
                  })}
                </span>
              ) : null}
              {result.emptyReason ? (
                <span className="text-warning">
                  {t(`knowledge.retrieveTest.emptyReason.${result.emptyReason}`)}
                </span>
              ) : null}
            </div>

            {result.hits.length === 0 ? (
              <p className="text-sm text-text-secondary">
                {t('knowledge.retrieveTest.noHits')}
              </p>
            ) : (
              <ul className="space-y-3">
                {result.hits.map((hit, index) => (
                  <li
                    key={hit.chunkId}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-surface-hover px-2 py-0.5 font-medium text-text-primary">
                        #{index + 1}
                      </span>
                      <span className="font-mono text-text-secondary">
                        {t('knowledge.retrieveTest.score', {
                          score: hit.score.toFixed(4),
                        })}
                      </span>
                      <span className="text-text-secondary">
                        {hit.sourceTitle} · {t('knowledge.detail.chunkIndex', {
                          index: hit.chunkIndex,
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-text-primary">
                      {hit.excerpt}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
