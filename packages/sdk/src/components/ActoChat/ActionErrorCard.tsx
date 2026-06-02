import { useTranslation } from 'react-i18next';
import type {
  ActionExecutionResult,
  ActionValidationIssue,
} from '@ahmedrioueche/actocore-shared';

export function ActionErrorCard({ action }: { action: ActionExecutionResult }) {
  const { t } = useTranslation();
  const issues = action.validationIssues ?? [];

  return (
    <div className="ac-action-card ac-action-card--error" role="alert">
      <div className="ac-action-card__result">
        <span className="ac-action-card__icon ac-action-card__icon--error" aria-hidden>
          !
        </span>
        <div className="ac-action-card__result-text">
          <div className="ac-action-card__title">
            {t('action.errorTitle', { name: action.actionName })}
          </div>
          {issues.length > 0 ? (
            <>
                <p className="ac-action-card__desc">{t('action.errorHintNl')}</p>
              <ul className="ac-action-card__issues">
                {issues.map((issue: ActionValidationIssue) => (
                  <li key={issue.field}>{issue.message}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="ac-action-card__feedback ac-action-card__feedback--error">
              {action.error ?? t('errors.generic')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
