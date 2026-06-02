import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ActionExecutionResult, ChatIntent, ChatMessageData } from '@ahmedrioueche/actocore-shared';
import type { UiChatMessage } from '../../hooks/use-actocore-chat';
import {
  useActionRegistry,
  useActocoreSecurity,
} from '../../context/actocore-context';
import { mergeClassNames } from '../../utils/merge-class-names';
import { shouldBlockAction } from '../../security/action-allowlist';

type LocalActionState = 'pending' | 'running' | 'success' | 'error';

function getActionName(action?: ActionExecutionResult) {
  return action?.actionName ?? '';
}

function formatInputEntries(input: Record<string, unknown>): [string, string][] {
  return Object.entries(input).map(([key, value]) => [
    key,
    typeof value === 'string' ? value : JSON.stringify(value),
  ]);
}

function ActionStatusIcon({ state }: { state: 'running' | 'success' | 'error' }) {
  if (state === 'running') {
    return <span className="ac-action-card__spinner" aria-hidden />;
  }
  if (state === 'success') {
    return (
      <span className="ac-action-card__icon ac-action-card__icon--success" aria-hidden>
        ✓
      </span>
    );
  }
  return (
    <span className="ac-action-card__icon ac-action-card__icon--error" aria-hidden>
      !
    </span>
  );
}

export function ActionPendingCard({
  message,
  sessionId,
}: {
  message: UiChatMessage;
  sessionId: string | undefined;
}) {
  const { t } = useTranslation();
  const security = useActocoreSecurity();
  const handlers = useActionRegistry();

  const action = message.action;

  const actionName = useMemo(() => getActionName(action), [action]);
  const isBlocked = action ? shouldBlockAction(actionName, security) : false;
  const handler = action ? handlers[action.actionName] : undefined;

  const [localState, setLocalState] = useState<LocalActionState>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!action) return null;

  const inputEntries = formatInputEntries(action.input ?? {});
  const canRun =
    localState === 'pending' && !!action && !isBlocked && !!handler;

  const run = async () => {
    if (!action) return;
    if (!sessionId) return;

    if (isBlocked) {
      setErrorMessage(t('action.denied'));
      setLocalState('error');
      return;
    }

    const runHandler = handlers[action.actionName];
    if (!runHandler) {
      setErrorMessage(
        t('action.handlerMissing', {
          name: action.actionName,
        }),
      );
      setLocalState('error');
      return;
    }

    setLocalState('running');
    setErrorMessage(null);

    try {
      const coreMessage: ChatMessageData = {
        sessionId,
        messageId: message.id,
        role: 'assistant',
        content: message.content,
        intent: (message.intent ?? 'action') as ChatIntent,
        action: message.action,
        sources: message.sources,
      };

      await runHandler(action.input, { message: coreMessage, sessionId });
      setLocalState('success');
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      setErrorMessage(t('action.failed', { message: err }));
      setLocalState('error');
    }
  };

  const retry = () => {
    setLocalState('pending');
    setErrorMessage(null);
  };

  const showRunButton = localState === 'pending' && !isBlocked && !!handler;
  const showRetryButton = localState === 'error' && !isBlocked && !!handler;

  return (
    <div
      className={mergeClassNames(
        'ac-action-card',
        `ac-action-card--${localState}`,
      )}
      role="region"
      aria-live="polite"
    >
      {localState === 'pending' ? (
        <>
          <div className="ac-action-card__header">
            <span className="ac-action-card__badge">{action.actionName}</span>
            <div className="ac-action-card__title">{t('action.pendingTitle')}</div>
          </div>
          <p className="ac-action-card__desc">
            {t('action.pendingDescription', { name: action.actionName })}
          </p>
          {inputEntries.length > 0 ? (
            <dl className="ac-action-card__params">
              <dt className="ac-action-card__params-label">{t('action.parameters')}</dt>
              {inputEntries.map(([key, value]) => (
                <div key={key} className="ac-action-card__param-row">
                  <dt>{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {isBlocked ? (
            <p className="ac-action-card__feedback ac-action-card__feedback--error">
              {t('action.denied')}
            </p>
          ) : !handler ? (
            <p className="ac-action-card__feedback ac-action-card__feedback--error">
              {t('action.handlerMissing', { name: action.actionName })}
            </p>
          ) : null}
        </>
      ) : (
        <div className="ac-action-card__result">
          <ActionStatusIcon
            state={localState === 'running' ? 'running' : localState === 'success' ? 'success' : 'error'}
          />
          <div className="ac-action-card__result-text">
            {localState === 'running' ? (
              <>
                <div className="ac-action-card__title">{action.actionName}</div>
                <p className="ac-action-card__desc">{t('action.running')}</p>
              </>
            ) : null}
            {localState === 'success' ? (
              <>
                <div className="ac-action-card__title">
                  {t('action.successTitle', { name: action.actionName })}
                </div>
                <p className="ac-action-card__desc ac-action-card__desc--success">
                  {t('action.successDescription')}
                </p>
              </>
            ) : null}
            {localState === 'error' ? (
              <>
                <div className="ac-action-card__title">{action.actionName}</div>
                <p className="ac-action-card__feedback ac-action-card__feedback--error">
                  {errorMessage ?? t('errors.generic')}
                </p>
              </>
            ) : null}
          </div>
        </div>
      )}

      {showRunButton ? (
        <button
          type="button"
          className="ac-action-card__run"
          onClick={run}
          disabled={!canRun}
          aria-label={t('action.run')}
        >
          {t('action.run')}
        </button>
      ) : null}

      {showRetryButton ? (
        <button
          type="button"
          className="ac-action-card__run ac-action-card__run--secondary"
          onClick={retry}
          aria-label={t('action.retry')}
        >
          {t('action.retry')}
        </button>
      ) : null}
    </div>
  );
}
