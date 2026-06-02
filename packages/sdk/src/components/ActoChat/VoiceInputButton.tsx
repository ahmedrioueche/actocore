import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useActocoreConfig,
  useActocoreVoiceConfig,
} from '../../context/actocore-context';
import { IconMic, IconSpinner, IconStop } from '../icons/ChatIcons';
import { mergeClassNames } from '../../utils/merge-class-names';
import { useVoiceInput } from '../../voice/use-voice-input';

export function VoiceInputButton({
  value,
  onValueChange,
  disabled,
}: {
  value: string;
  onValueChange: (next: string) => void;
  disabled: boolean;
}) {
  const sessionBaseRef = useRef<string | null>(null);
  const { t } = useTranslation();
  const voice = useActocoreVoiceConfig();
  const { i18n } = useActocoreConfig();

  const {
    error,
    isSupported,
    isListening,
    isTranscribing,
    toggleListening,
  } = useVoiceInput({
    inputMode: voice.inputMode,
    language: voice.language,
    locale: i18n.locale,
    onTranscript: (text, isFinal) => {
      const base = sessionBaseRef.current ?? '';
      const merged = base.trim()
        ? `${base.trim()} ${text.trim()}`.trim()
        : text.trim();
      if (isFinal) {
        sessionBaseRef.current = merged;
      }
      onValueChange(merged);
    },
  });

  useEffect(() => {
    if (isListening && sessionBaseRef.current === null) {
      sessionBaseRef.current = value;
    }
    if (!isListening && !isTranscribing) {
      sessionBaseRef.current = null;
    }
  }, [isListening, isTranscribing, value]);

  if (!voice.input) {
    return null;
  }

  const busy = disabled || isTranscribing;
  const active = isListening;
  const errorKey = error?.startsWith('voice.') ? error : null;

  return (
    <button
      type="button"
      className={mergeClassNames(
        'ac-chat__voice-btn',
        active && 'ac-chat__voice-btn--active',
        isTranscribing && 'ac-chat__voice-btn--busy',
      )}
      onClick={() => toggleListening()}
      disabled={busy || !isSupported}
      aria-pressed={active}
      aria-label={
        isTranscribing
          ? t('voice.transcribing')
          : active
            ? t('voice.stopListening')
            : t('voice.startListening')
      }
      title={
        errorKey
          ? t(errorKey)
          : !isSupported
            ? t('voice.unavailable')
            : active
              ? t('voice.stopListening')
              : t('voice.startListening')
      }
    >
      {isTranscribing ? (
        <IconSpinner />
      ) : active ? (
        <IconStop />
      ) : (
        <IconMic />
      )}
    </button>
  );
}
