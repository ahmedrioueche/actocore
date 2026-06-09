import { useEffect, useRef, useState } from 'react';

const MIN_CHARS_PER_FRAME = 1;
const MAX_CHARS_PER_FRAME = 10;

/**
 * Reveals `fullText` progressively while `isStreaming` so the UI streams even when
 * the network delivers batched SSE deltas.
 */
export function useStreamingReveal(
  fullText: string,
  isStreaming: boolean,
): string {
  const revealedRef = useRef(0);
  const [revealedLength, setRevealedLength] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!isStreaming) {
      revealedRef.current = fullText.length;
      setRevealedLength(fullText.length);
      return;
    }

    if (fullText.length === 0) {
      revealedRef.current = 0;
      setRevealedLength(0);
    }

    let cancelled = false;

    const tick = () => {
      if (cancelled) return;

      const current = revealedRef.current;
      if (current >= fullText.length) return;

      const backlog = fullText.length - current;
      const step = Math.max(
        MIN_CHARS_PER_FRAME,
        Math.min(MAX_CHARS_PER_FRAME, Math.ceil(backlog / 5)),
      );
      const next = Math.min(current + step, fullText.length);
      revealedRef.current = next;
      setRevealedLength(next);

      if (next < fullText.length) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    if (revealedRef.current < fullText.length) {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [fullText, isStreaming]);

  return fullText.slice(0, revealedLength);
}
