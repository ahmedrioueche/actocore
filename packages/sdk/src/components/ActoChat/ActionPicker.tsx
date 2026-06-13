import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { filterActionsForPageScope } from '@ahmedrioueche/actocore-shared';
import {
  useActocoreHostContext,
  useActocoreUiConfig,
} from '../../context/actocore-context';
import { useActocoreActions } from '../../hooks/use-actocore-actions';
import { mergeClassNames } from '../../utils/merge-class-names';
import {
  formatActionShortcutLabel,
  getActionPromptStarter,
} from '../../utils/action-prompt-starters';
import { IconChevronRight, IconX, IconZap } from '../icons/ChatIcons';

type ActionScope = 'page' | 'all';

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
  const { hostContext, appPages } = useActocoreHostContext();
  const { actions, isLoading } = useActocoreActions({ requireHandlers: false });
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<ActionScope>('page');

  const pageActions = useMemo(
    () =>
      filterActionsForPageScope(
        actions,
        hostContext?.currentPage,
        appPages,
      ),
    [actions, appPages, hostContext?.currentPage],
  );

  const visibleActions = scope === 'all' ? actions : pageActions;

  const shortcuts = useMemo(
    () =>
      visibleActions.map((action) => ({
        name: action.name,
        label: formatActionShortcutLabel(action.name),
        description: action.description,
        starter: getActionPromptStarter(action.name),
      })),
    [visibleActions],
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

  useEffect(() => {
    if (open) {
      setScope(pageActions.length > 0 ? 'page' : 'all');
    }
  }, [open, pageActions.length]);

  if (!ui.showActionPicker || (!isLoading && actions.length === 0)) {
    return null;
  }

  const pick = (starter: string) => {
    onInsertPrompt(starter);
    setOpen(false);
  };

  const showScopeToggle = actions.length > 0;
  const emptyScopeMessage =
    scope === 'page' && shortcuts.length === 0
      ? hostContext?.currentPage
        ? t('action.pickerEmptyPage')
        : t('action.pickerEmptyNoPage')
      : null;

  return (
    <div ref={rootRef} className="ac-action-picker ac-action-picker--composer">
      <button
        type="button"
        className={mergeClassNames(
          'ac-action-picker__toggle',
          open && 'ac-action-picker__toggle--open',
        )}
        onClick={() => setOpen((value) => !value)}
        disabled={disabled || isLoading}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t('action.pickerOpen')}
        title={t('action.pickerOpen')}
      >
        <IconZap className="ac-action-picker__toggle-icon" />
      </button>

      {open ? (
        <div
          className="ac-action-picker__panel"
          role="dialog"
          aria-label={t('action.pickerTitle')}
        >
          <div className="ac-action-picker__panel-header">
            <div className="ac-action-picker__panel-heading">
              <p className="ac-action-picker__panel-title">
                {t('action.pickerTitle')}
              </p>
              <p className="ac-action-picker__desc">{t('action.pickerHint')}</p>
            </div>
            <button
              type="button"
              className="ac-action-picker__close"
              onClick={() => setOpen(false)}
              aria-label={t('chat.close')}
            >
              <IconX />
            </button>
          </div>

          {showScopeToggle ? (
            <div
              className="ac-action-picker__scope"
              role="tablist"
              aria-label={t('action.pickerScopeLabel')}
            >
              <button
                type="button"
                role="tab"
                className={mergeClassNames(
                  'ac-action-picker__scope-btn',
                  scope === 'page' && 'ac-action-picker__scope-btn--active',
                )}
                aria-selected={scope === 'page'}
                onClick={() => setScope('page')}
              >
                {t('action.pickerScopePage')}
              </button>
              <button
                type="button"
                role="tab"
                className={mergeClassNames(
                  'ac-action-picker__scope-btn',
                  scope === 'all' && 'ac-action-picker__scope-btn--active',
                )}
                aria-selected={scope === 'all'}
                onClick={() => setScope('all')}
              >
                {t('action.pickerScopeAll')}
              </button>
            </div>
          ) : null}

          {isLoading ? (
            <p className="ac-action-picker__meta">{t('chat.loading')}</p>
          ) : emptyScopeMessage ? (
            <p className="ac-action-picker__meta">{emptyScopeMessage}</p>
          ) : (
            <ul className="ac-action-picker__list">
              {shortcuts.map((item) => (
                <li key={item.name}>
                  <button
                    type="button"
                    className="ac-action-picker__item"
                    onClick={() => pick(item.starter)}
                  >
                    <span className="ac-action-picker__item-body">
                      <span className="ac-action-picker__item-name">
                        {item.label}
                      </span>
                      {item.description ? (
                        <span className="ac-action-picker__item-desc">
                          {item.description}
                        </span>
                      ) : null}
                    </span>
                    <IconChevronRight className="ac-action-picker__item-chevron" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
