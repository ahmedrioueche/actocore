import { asStringArray } from '@/i18n/as-string-array';
import { useT } from '@/i18n/useT';
import { Checkbox, TextArea } from '@/components/ui';

import type { DemoUser } from '../demo-users';
import { DemoUsersPanel } from '../DemoUsersPanel';
import type { PlaygroundActionDefinition } from '../types';

type ActionsPanelProps = {
  users: DemoUser[];
  actions: PlaygroundActionDefinition[];
  onActionsChange: (actions: PlaygroundActionDefinition[]) => void;
};

export function ActionsPanel({ users, actions, onActionsChange }: ActionsPanelProps) {
  const { t } = useT('playground.actionsPanel');
  const prompts = asStringArray(t('prompts', { returnObjects: true }));

  function updateAction(index: number, patch: Partial<PlaygroundActionDefinition>) {
    onActionsChange(
      actions.map((action, i) => (i === index ? { ...action, ...patch } : action)),
    );
  }

  return (
    <div className="space-y-4">
      <section className="glass-panel rounded-2xl border border-border p-5">
        <h2 className="mb-1 text-lg font-semibold text-text-primary">{t('definitionsTitle')}</h2>
        <p className="mb-4 text-sm text-text-secondary">{t('definitionsDescription')}</p>
        <ul className="space-y-3">
          {actions.map((action, index) => (
            <li
              key={action.name}
              className="rounded-xl border border-border bg-surface-secondary/50 px-4 py-3"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <code className="text-sm font-semibold text-primary">{action.name}</code>
                <Checkbox
                  id={`action-enabled-${action.name}`}
                  variant="inline"
                  checked={action.enabled}
                  onChange={(checked) => updateAction(index, { enabled: checked })}
                  label={t('enabledLabel')}
                  className="shrink-0"
                />
              </div>
              <TextArea
                id={`action-description-${action.name}`}
                label={t('descriptionLabel')}
                rows={2}
                value={action.description}
                onChange={(event) =>
                  updateAction(index, { description: event.target.value })
                }
              />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">{t('localHint')}</p>
      </section>

      <DemoUsersPanel users={users} />

      {prompts.length > 0 ? (
        <section className="glass-panel rounded-2xl border border-border p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('promptsTitle')}
          </p>
          <ul className="space-y-1.5 text-xs text-text-secondary">
            {prompts.map((prompt) => (
              <li key={prompt}>
                <code className="rounded bg-surface-secondary px-1.5 py-0.5 text-text-primary">
                  {prompt}
                </code>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
