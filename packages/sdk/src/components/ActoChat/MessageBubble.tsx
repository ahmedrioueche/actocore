import { useTranslation } from 'react-i18next';
import type { UiChatMessage } from '../../hooks/use-actocore-chat';
import { useActocoreUiConfig } from '../../context/actocore-context';
import { mergeClassNames } from '../../utils/merge-class-names';
import { SourceCitations } from './SourceCitations';
import { ActionPendingCard } from './ActionPendingCard';
import { ActionErrorCard } from './ActionErrorCard';
import { ListenButton } from './ListenButton';
import { ChatMessageContent } from './ChatMessageContent';

export function MessageBubble({
  message,
  showIntentBadge,
  showSources,
  sessionId,
}: {
  message: UiChatMessage;
  showIntentBadge?: boolean;
  showSources?: boolean;
  sessionId: string | undefined;
}) {
  const { t } = useTranslation();
  const ui = useActocoreUiConfig();
  const isUser = message.role === 'user';

  return (
    <div
      className={mergeClassNames(
        'ac-chat__row',
        isUser ? 'ac-chat__row--user' : 'ac-chat__row--assistant',
      )}
    >
      <div
        className={mergeClassNames(
          'ac-chat__bubble',
          isUser ? 'ac-chat__bubble--user' : 'ac-chat__bubble--assistant',
          message.isErrorNotice && 'ac-chat__bubble--error-notice',
          isUser ? ui.classNames?.userBubble : ui.classNames?.assistantBubble,
        )}
      >
        {showIntentBadge && message.intent && !message.isErrorNotice ? (
          <span className="ac-chat__intent">{t(`intent.${message.intent}`)}</span>
        ) : null}

        {!(
          message.intent === 'action' &&
          message.action?.status === 'error' &&
          (message.action.validationIssues?.length ?? 0) > 0
        ) ? (
          <>
            <div
              className={mergeClassNames(
                'ac-chat__bubble-text',
                !isUser && 'ac-chat__bubble-text--markdown',
              )}
            >
              <ChatMessageContent
                content={message.content}
                markdown={!isUser}
              />
            </div>
            {!isUser && message.content && !message.isErrorNotice ? (
              <div className="ac-chat__bubble-footer">
                <ListenButton text={message.content} />
              </div>
            ) : null}
          </>
        ) : null}

        {showSources && message.intent === 'qa' && message.sources ? (
          <SourceCitations sources={message.sources} />
        ) : null}

        {message.intent === 'action' && message.action?.status === 'error' ? (
          <ActionErrorCard action={message.action} />
        ) : null}

        {message.intent === 'action' &&
        message.action?.status === 'pending' ? (
          <ActionPendingCard message={message} sessionId={sessionId} />
        ) : null}
      </div>
    </div>
  );
}
