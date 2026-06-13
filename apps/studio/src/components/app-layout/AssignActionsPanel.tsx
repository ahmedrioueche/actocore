import type { ActionData } from '@ahmedrioueche/actocore-shared';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AssignActionsPanelProps {
  actions: ActionData[];
  selectedActionIds: string[];
  onChange: (actionIds: string[]) => void;
  disabled?: boolean;
}

export function AssignActionsPanel({
  actions,
  selectedActionIds,
  onChange,
  disabled = false,
}: AssignActionsPanelProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return actions;
    }
    return actions.filter(
      (action) =>
        action.name.toLowerCase().includes(q) ||
        action.description?.toLowerCase().includes(q),
    );
  }, [actions, query]);

  const toggle = (actionId: string) => {
    if (disabled) {
      return;
    }
    if (selectedActionIds.includes(actionId)) {
      onChange(selectedActionIds.filter((id) => id !== actionId));
      return;
    }
    onChange([...selectedActionIds, actionId]);
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4 md:p-6">
      <h4 className="text-sm font-semibold text-text-primary">
        {t('projectLayout.actions.title')}
      </h4>
      <p className="mt-1 text-sm text-text-secondary">
        {t('projectLayout.actions.description')}
      </p>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('projectLayout.actions.searchPlaceholder')}
        className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        disabled={disabled}
      />

      {actions.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">
          {t('projectLayout.actions.noActions')}
        </p>
      ) : (
        <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto">
          {filtered.map((action) => {
            const checked = selectedActionIds.includes(action.id);
            return (
              <li key={action.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2 hover:bg-surface-hover">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(action.id)}
                    disabled={disabled}
                    className="mt-1"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-sm text-text-primary">
                      {action.name}
                    </span>
                    {action.description ? (
                      <span className="block text-xs text-text-secondary">
                        {action.description}
                      </span>
                    ) : null}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
