import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DEMO_ACTION_SCHEMAS } from '../../actions/demo-action-catalog';
import {
  useActionRegistry,
  useActocoreSecurity,
  useActocoreUiConfig,
} from '../../context/actocore-context';
import { isActionAllowed } from '../../security/action-allowlist';
import { mergeClassNames } from '../../utils/merge-class-names';
import {
  formatActionShortcutLabel,
  getActionPromptStarter,
} from '../../utils/action-prompt-starters';

export function ActionPicker({
  onInsertPrompt,
  disabled,
}: {
  /** Puts starter text in the composer — user edits and sends in their own words. */
  onInsertPrompt: (text: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const ui = useActocoreUiConfig();
  const security = useActocoreSecurity();
  const handlers = useActionRegistry();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const shortcuts = useMemo(
    () =>
      Object.keys(handlers)
        .filter((name) => isActionAllowed(name, security))
        .map((name) => ({
          name,
          label: formatActionShortcutLabel(name),
          description: DEMO_ACTION_SCHEMAS[name]?.description,
          starter: getActionPromptStarter(name),
        })),
    [handlers, security],
  );

  useEffect(() => {
    if (!open) return;

    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  if (!ui.showActionPicker || shortcuts.length === 0) {
    return null;
  }

  const pick = (starter: string) => {
    onInsertPrompt(starter);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="ac-action-picker">
      <button
        type="button"
        className={mergeClassNames(
          'ac-action-picker__toggle',
          open && 'ac-action-picker__toggle--open',
        )}
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t('action.pickerOpen')}
        title={t('action.pickerOpen')}
      >
        <span aria-hidden>⚡</span>
      </button>

      {open ? (
        <div
          className="ac-action-picker__panel"
          role="dialog"
          aria-label={t('action.pickerTitle')}
        >
          <div className="ac-action-picker__panel-title">
            {t('action.pickerTitle')}
          </div>
          <p className="ac-action-picker__desc">{t('action.pickerHint')}</p>
          <ul className="ac-action-picker__list">
            {shortcuts.map((item) => (
              <li key={item.name}>
                <button
                  type="button"
                  className="ac-action-picker__item"
                  onClick={() => pick(item.starter)}
                >
                  <span className="ac-action-picker__item-name">{item.label}</span>
                  {item.description ? (
                    <span className="ac-action-picker__item-desc">
                      {item.description}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
