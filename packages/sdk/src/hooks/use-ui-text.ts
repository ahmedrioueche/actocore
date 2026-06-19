import { useTranslation } from 'react-i18next';
import { useActocoreUiConfig } from '../context/actocore-context';
import type { ActocoreUiTextOverrides } from '../config/types';

type TextKey = keyof ActocoreUiTextOverrides;

const I18N_KEYS: Record<TextKey, string> = {
  headerTitle: 'chat.title',
  headerSubtitle: 'chat.subtitle',
  emptyTitle: 'chat.emptyTitle',
  emptyDescription: 'chat.emptyDescription',
  actionsHint: 'chat.actionsHint',
  placeholder: 'chat.placeholder',
  send: 'chat.send',
  open: 'chat.open',
  newConversation: 'chat.newConversation',
  minimize: 'chat.minimize',
  stop: 'chat.stop',
};

/** Resolves copy from `ui.text` overrides first, then bundled i18n. */
export function useUiText(key: TextKey): string {
  const ui = useActocoreUiConfig();
  const { t } = useTranslation();
  const override = ui.text?.[key];
  if (override !== undefined) {
    return override;
  }
  return t(I18N_KEYS[key]);
}
