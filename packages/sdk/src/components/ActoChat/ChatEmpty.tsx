import { useUiText } from '../../hooks/use-ui-text';
import { useActocoreUiConfig } from '../../context/actocore-context';

export function ChatEmpty() {
  const ui = useActocoreUiConfig();
  const title = useUiText('emptyTitle');
  const description = useUiText('emptyDescription');
  const actionsHint = useUiText('actionsHint');

  return (
    <div className="ac-chat__empty">
      {title.trim() ? (
        <p className="ac-chat__empty-title">{title}</p>
      ) : null}
      {description.trim() ? (
        <p className="ac-chat__empty-desc">{description}</p>
      ) : null}
      {ui.showActionsHint && actionsHint.trim() ? (
        <p className="ac-chat__actions-hint">{actionsHint}</p>
      ) : null}
    </div>
  );
}
