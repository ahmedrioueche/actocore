import { useState } from 'react';

import { InputField } from '@/components/ui';
import { useT } from '@/i18n/useT';
import { getHeroVisitorId } from '@/lib/marketing-chat';

import { bootstrapPlaygroundProject } from './playground-api';
import {
  savePlaygroundProject,
  type PlaygroundProjectCredentials,
} from './playground-project';

type PlaygroundSetupWizardProps = {
  onComplete: (credentials: PlaygroundProjectCredentials) => void;
};

export function PlaygroundSetupWizard({ onComplete }: PlaygroundSetupWizardProps) {
  const { t } = useT('playground.setup');
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const credentials = await bootstrapPlaygroundProject({
        visitorId: getHeroVisitorId(),
        projectName: projectName.trim() || t('defaultProjectName'),
      });
      savePlaygroundProject(credentials);
      onComplete(credentials);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel mx-auto max-w-lg rounded-2xl border border-border p-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
        {t('eyebrow')}
      </p>
      <h2 className="mb-2 text-2xl font-bold text-text-primary">{t('title')}</h2>
      <p className="mb-6 text-sm leading-relaxed text-text-secondary">
        {t('description')}
      </p>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <InputField
          id="playground-project-name"
          label={t('projectNameLabel')}
          value={projectName}
          onChange={(event) => setProjectName(event.target.value)}
          placeholder={t('projectNamePlaceholder')}
        />

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? t('creating') : t('createProject')}
        </button>
      </form>
    </div>
  );
}
