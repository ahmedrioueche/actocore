import type { ActocoreUiConfig } from '../config/types';

/** Map widget layout fields to theme CSS variables. */
export function resolveLayoutTokens(
  ui: Pick<ActocoreUiConfig, 'widget'> | undefined,
): Record<string, string> {
  const tokens: Record<string, string> = {};
  const widget = ui?.widget;
  if (!widget) {
    return tokens;
  }

  if (widget.panelWidth?.trim()) {
    tokens['chat-max-width'] = widget.panelWidth.trim();
  }
  if (widget.panelHeight?.trim()) {
    tokens['widget-panel-height'] = widget.panelHeight.trim();
  }

  return tokens;
}
