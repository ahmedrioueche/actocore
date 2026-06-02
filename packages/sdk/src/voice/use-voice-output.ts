import { useCallback, useEffect, useRef, useState } from 'react';

export function useVoiceOutput(locale: string) {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [activeText, setActiveText] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setActiveText(null);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) return;

      const normalized = text.trim();
      if (activeText === normalized) {
        stop();
        return;
      }

      stop();
      const utterance = new SpeechSynthesisUtterance(normalized);
      utterance.lang = locale;
      utterance.onend = () => {
        setActiveText((current) => (current === normalized ? null : current));
        utteranceRef.current = null;
      };
      utterance.onerror = () => {
        setActiveText((current) => (current === normalized ? null : current));
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      setActiveText(normalized);
      window.speechSynthesis.speak(utterance);
    },
    [activeText, locale, stop, supported],
  );

  const isSpeaking = useCallback(
    (text: string) => activeText === text.trim(),
    [activeText],
  );

  return { speak, stop, supported, isSpeaking, activeText };
}
