import { useCallback, useEffect, useRef, useState } from 'react';
import { voiceApi } from '@ahmedrioueche/actocore-shared';
import type { ActocoreVoiceInputMode } from '../config/types';
import { useApiErrorMessage } from '../hooks/use-api-error';
import { useActocoreRuntime } from '../hooks/use-actocore-runtime';
import {
  getSpeechRecognitionCtor,
  isBrowserSpeechRecognitionSupported,
} from './browser-speech';
import { startAudioRecording } from './media-recorder';

export type VoiceInputStatus = 'idle' | 'listening' | 'transcribing';

export function useVoiceInput(options: {
  inputMode: ActocoreVoiceInputMode;
  language?: string;
  locale: string;
  onTranscript: (text: string, isFinal: boolean) => void;
}) {
  const { inputMode, language, locale, onTranscript } = options;
  const formatError = useApiErrorMessage();
  const { config: runtime } = useActocoreRuntime();
  const [status, setStatus] = useState<VoiceInputStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<InstanceType<
    NonNullable<ReturnType<typeof getSpeechRecognitionCtor>>
  > | null>(null);
  const recordingRef = useRef<{ stop: () => Promise<Blob> } | null>(null);

  const browserAvailable = isBrowserSpeechRecognitionSupported();
  const serverAvailable = runtime?.voice?.serverTranscription === true;

  const mode: 'browser' | 'server' | 'none' = (() => {
    if (inputMode === 'browser') {
      return browserAvailable ? 'browser' : 'none';
    }
    if (inputMode === 'server') {
      return serverAvailable ? 'server' : 'none';
    }
    if (browserAvailable) return 'browser';
    if (serverAvailable) return 'server';
    return 'none';
  })();

  const cleanupRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try {
      recognition.abort();
    } catch {
      // ignore
    }
    recognitionRef.current = null;
  }, []);

  useEffect(() => () => cleanupRecognition(), [cleanupRecognition]);

  const stopListening = useCallback(async () => {
    setError(null);

    if (mode === 'browser') {
      cleanupRecognition();
      setStatus('idle');
      return;
    }

    if (mode === 'server' && recordingRef.current) {
      setStatus('transcribing');
      try {
        const blob = await recordingRef.current.stop();
        recordingRef.current = null;
        const res = await voiceApi.transcribe(blob, {
          language: language ?? locale.split('-')[0],
          filename: 'recording.webm',
        });
        if (!res.success || !res.data?.text?.trim()) {
          setError(formatError(res));
          setStatus('idle');
          return;
        }
        onTranscript(res.data.text.trim(), true);
        setStatus('idle');
      } catch (e) {
        setError(formatError(e));
        setStatus('idle');
      }
      return;
    }

    setStatus('idle');
  }, [
    cleanupRecognition,
    formatError,
    language,
    locale,
    mode,
    onTranscript,
  ]);

  const startListening = useCallback(async () => {
    setError(null);

    if (mode === 'none') {
      setError('voice.unavailable');
      return;
    }

    if (mode === 'browser') {
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) {
        setError('voice.unavailable');
        return;
      }

      cleanupRecognition();
      const recognition = new Ctor();
      recognition.lang = language ?? locale;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let interim = '';
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? '';
          if (result.isFinal) {
            finalText += transcript;
          } else {
            interim += transcript;
          }
        }
        if (finalText.trim()) {
          onTranscript(finalText.trim(), true);
        } else if (interim.trim()) {
          onTranscript(interim.trim(), false);
        }
      };

      recognition.onerror = () => {
        setError('voice.listenFailed');
        setStatus('idle');
        cleanupRecognition();
      };

      recognition.onend = () => {
        if (recognitionRef.current === recognition) {
          setStatus('idle');
          recognitionRef.current = null;
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setStatus('listening');
      return;
    }

    try {
      recordingRef.current = await startAudioRecording();
      setStatus('listening');
    } catch {
      setError('voice.micDenied');
      setStatus('idle');
    }
  }, [
    cleanupRecognition,
    language,
    locale,
    mode,
    onTranscript,
  ]);

  const toggleListening = useCallback(() => {
    if (status === 'listening') {
      void stopListening();
      return;
    }
    void startListening();
  }, [startListening, status, stopListening]);

  return {
    status,
    error,
    mode,
    isSupported: mode !== 'none',
    isListening: status === 'listening',
    isTranscribing: status === 'transcribing',
    toggleListening,
    stopListening,
  };
}
