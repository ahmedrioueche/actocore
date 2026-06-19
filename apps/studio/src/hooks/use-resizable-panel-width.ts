import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

const DEFAULT_WIDTH = 384;
const MIN_WIDTH = 320;
const MAX_WIDTH = 720;

function clampWidth(value: number, max = MAX_WIDTH) {
  return Math.min(max, Math.max(MIN_WIDTH, value));
}

function readStoredWidth(storageKey: string, fallback: number): number {
  if (typeof window === 'undefined') {
    return fallback;
  }
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? clampWidth(parsed) : fallback;
}

/** Drag the start edge of a trailing panel to change its width (pointer-driven). */
export function useResizablePanelWidth(
  storageKey: string,
  defaultWidth = DEFAULT_WIDTH,
) {
  const [width, setWidth] = useState(() =>
    readStoredWidth(storageKey, defaultWidth),
  );
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      dragRef.current = { startX: event.clientX, startWidth: width };
      setIsResizing(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [width],
  );

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const onPointerMove = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) {
        return;
      }
      const next = clampWidth(drag.startWidth + (drag.startX - event.clientX));
      setWidth(next);
    };

    const onPointerUp = () => {
      dragRef.current = null;
      setIsResizing(false);
      setWidth((current) => {
        localStorage.setItem(storageKey, String(current));
        return current;
      });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [isResizing, storageKey]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }
    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
    };
  }, [isResizing]);

  return {
    width,
    isResizing,
    onResizePointerDown,
  };
}
