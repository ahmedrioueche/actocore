import { useCallback, useSyncExternalStore } from 'react';

function queryMatches(selector: string): boolean {
  if (!selector.trim()) return false;
  try {
    return document.querySelector(selector) != null;
  } catch {
    return false;
  }
}

/**
 * When `selector` matches any element in the document, the widget should hide
 * (e.g. host app sets `data-modal-open` on `<body>` while a modal is open).
 */
export function useSuppressedWhenSelector(selector: string | undefined) {
  const trimmed = selector?.trim() ?? '';

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!trimmed) return () => undefined;

      const check = () => onStoreChange();
      const observer = new MutationObserver(check);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'data-modal-open', 'aria-hidden'],
      });
      window.addEventListener('focus', check);

      return () => {
        observer.disconnect();
        window.removeEventListener('focus', check);
      };
    },
    [trimmed],
  );

  const getSnapshot = useCallback(
    () => (trimmed ? queryMatches(trimmed) : false),
    [trimmed],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
