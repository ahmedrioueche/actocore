import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAutoResizeTextarea } from '../../hooks/use-auto-resize-textarea';
import { useUiText } from '../../hooks/use-ui-text';
import { useActocoreUiConfig } from '../../context/actocore-context';
import { mergeClassNames } from '../../utils/merge-class-names';
import { IconSend, IconSpinner, IconStop } from '../icons/ChatIcons';
import { ActionPicker } from './ActionPicker';
import { VoiceInputButton } from './VoiceInputButton';

export function Composer({
  onSend,
  onStop,
  isSending,
  isStreaming,
  disabled: composerDisabled = false,
  minRows = 1,
  maxRows = 5,
}: {
  onSend: (content: string) => Promise<void>;
  onStop?: () => void;
  isSending: boolean;
  isStreaming?: boolean;
  disabled?: boolean;
  minRows?: number;
  maxRows?: number;
}) {
  const { t } = useTranslation();
  const ui = useActocoreUiConfig();
  const placeholder = useUiText('placeholder');
  const sendLabel = useUiText('send');
  const [value, setValue] = useState('');
  const [isMultiline, setIsMultiline] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useAutoResizeTextarea(inputRef, value, minRows, maxRows);

  useLayoutEffect(() => {
    const element = inputRef.current;
    if (!element) return;

    const styles = getComputedStyle(element);
    const fontSize = parseFloat(styles.fontSize) || 16;
    const lineHeightRaw = styles.lineHeight;
    const lineHeight = lineHeightRaw.endsWith('px')
      ? parseFloat(lineHeightRaw)
      : fontSize * (parseFloat(lineHeightRaw) || 1.5);
    const paddingY =
      parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
    const singleRowHeight = lineHeight * minRows + paddingY;

    setIsMultiline(element.offsetHeight > singleRowHeight + 1);
  }, [value, minRows, maxRows]);

  const trimmed = useMemo(() => value.trim(), [value]);
  const showStop = Boolean(isStreaming && onStop);
  const inputDisabled = composerDisabled || isSending;
  const sendDisabled = composerDisabled || isSending || trimmed.length === 0;

  const submit = useCallback(async () => {
    if (sendDisabled) return;
    const content = value.trim();
    if (!content) return;
    setValue('');
    await onSend(content);
  }, [onSend, sendDisabled, value]);

  return (
    <div
      className={mergeClassNames('ac-chat__composer', ui.classNames?.composer)}
    >
      <div
        className={mergeClassNames(
          'ac-chat__composer-inner',
          isMultiline && 'ac-chat__composer-inner--multiline',
          ui.classNames?.composerField,
        )}
      >
        <ActionPicker onInsertPrompt={setValue} disabled={inputDisabled} />
        <textarea
          ref={inputRef}
          className="ac-chat__input ac-scrollbar"
          value={value}
          placeholder={placeholder}
          disabled={composerDisabled}
          onChange={(e) => setValue(e.target.value)}
          rows={1}
          aria-label={placeholder}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            if (e.shiftKey) return;
            e.preventDefault();
            void submit();
          }}
        />
        <div className="ac-chat__composer-actions">
          <VoiceInputButton
            value={value}
            onValueChange={setValue}
            disabled={inputDisabled}
          />
          <button
            type="button"
            className={mergeClassNames(
              'ac-chat__send',
              showStop && 'ac-chat__send--stop',
              ui.classNames?.sendButton,
            )}
            onClick={() => (showStop ? onStop?.() : void submit())}
            disabled={showStop ? false : sendDisabled}
            aria-label={showStop ? t('chat.stop') : sendLabel}
            title={
              showStop
                ? t('chat.stop')
                : isSending
                  ? t('chat.sending')
                  : sendLabel
            }
          >
            {showStop ? (
              <IconStop />
            ) : isSending ? (
              <IconSpinner />
            ) : (
              <IconSend />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
