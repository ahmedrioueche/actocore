import { useLayoutEffect, type RefObject } from 'react';

const LINE_HEIGHT_REM = 1.5;

function rowHeightPx(element: HTMLTextAreaElement): number {
  const styles = getComputedStyle(element);
  const fontSize = parseFloat(styles.fontSize) || 16;
  const lineHeight = styles.lineHeight;
  if (lineHeight.endsWith('px')) {
    return parseFloat(lineHeight);
  }
  const ratio = parseFloat(lineHeight) || LINE_HEIGHT_REM;
  return fontSize * ratio;
}

/**
 * Grows a textarea with its content up to maxRows, then scrolls inside the field.
 */
export function useAutoResizeTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  minRows: number,
  maxRows: number,
): void {
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const lineHeight = rowHeightPx(element);
    const paddingY =
      parseFloat(getComputedStyle(element).paddingTop) +
      parseFloat(getComputedStyle(element).paddingBottom);
    const minHeight = lineHeight * minRows + paddingY;
    const maxHeight = lineHeight * maxRows + paddingY;

    element.style.height = '0px';
    const contentHeight = element.scrollHeight;
    const nextHeight = Math.min(Math.max(contentHeight, minHeight), maxHeight);

    element.style.height = `${nextHeight}px`;
    element.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';
  }, [ref, value, minRows, maxRows]);
}
