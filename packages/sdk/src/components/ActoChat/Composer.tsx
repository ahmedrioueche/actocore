import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAutoResizeTextarea } from '../../hooks/use-auto-resize-textarea';
import { useUiText } from '../../hooks/use-ui-text';
import { useActocoreUiConfig } from '../../context/actocore-context';
import { mergeClassNames } from '../../utils/merge-class-names';
import { IconSend, IconSpinner } from '../icons/ChatIcons';
import { ActionPicker } from './ActionPicker';
import { VoiceInputButton } from './VoiceInputButton';

export function Composer({
  onSend,
  isSending,
  minRows = 1,
  maxRows = 5,
}: {
  onSend: (content: string) => Promise<void>;
  isSending: boolean;
  minRows?: number;
  maxRows?: number;
}) {
  const { t } = useTranslation();
  const ui = useActocoreUiConfig();
  const placeholder = useUiText('placeholder');
  const sendLabel = useUiText('send');
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useAutoResizeTextarea(inputRef, value, minRows, maxRows);

  const trimmed = useMemo(() => value.trim(), [value]);
  const disabled = isSending || trimmed.length === 0;

  const submit = useCallback(async () => {
    if (disabled) return;
    const content = value.trim();
    if (!content) return;
    setValue('');
    await onSend(content);
  }, [disabled, onSend, value]);

  return (
    <div
      className={mergeClassNames('ac-chat__composer', ui.classNames?.composer)}
    >
      <div className="ac-chat__composer-row">
        <ActionPicker
          onInsertPrompt={setValue}
          disabled={isSending}
        />
        <div
          className={mergeClassNames(
            'ac-chat__composer-inner',
            ui.classNames?.composerField,
          )}
        >
          <textarea
            ref={inputRef}
            className="ac-chat__input ac-scrollbar"
            value={value}
            placeholder={placeholder}
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
              disabled={isSending}
            />
            <button
              type="button"
              className={mergeClassNames(
                'ac-chat__send',
                ui.classNames?.sendButton,
              )}
              onClick={() => void submit()}
              disabled={disabled}
              aria-label={sendLabel}
              title={isSending ? t('chat.sending') : sendLabel}
            >
              {isSending ? <IconSpinner /> : <IconSend />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
