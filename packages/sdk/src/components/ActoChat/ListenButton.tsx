import { useTranslation } from 'react-i18next';
import { useActocoreConfig, useActocoreVoiceConfig } from '../../context/actocore-context';
import { IconStop, IconVolume } from '../icons/ChatIcons';
import { mergeClassNames } from '../../utils/merge-class-names';
import { useVoiceOutput } from '../../voice/use-voice-output';

export function ListenButton({ text }: { text: string }) {
  const { t } = useTranslation();
  const voice = useActocoreVoiceConfig();
  const { i18n } = useActocoreConfig();
  const { speak, supported, isSpeaking } = useVoiceOutput(i18n.locale);

  if (!voice.output || !text.trim()) {
    return null;
  }

  const playing = isSpeaking(text);

  return (
    <button
      type="button"
      className={mergeClassNames(
        'ac-chat__listen-btn',
        playing && 'ac-chat__listen-btn--active',
      )}
      disabled={!supported}
      onClick={() => speak(text)}
      aria-pressed={playing}
      aria-label={playing ? t('voice.stopSpeaking') : t('voice.listen')}
      title={supported ? (playing ? t('voice.stopSpeaking') : t('voice.listen')) : t('voice.unavailable')}
    >
      {playing ? <IconStop /> : <IconVolume />}
      <span className="ac-chat__listen-btn-label">
        {playing ? t('voice.stopSpeaking') : t('voice.listen')}
      </span>
    </button>
  );
}
