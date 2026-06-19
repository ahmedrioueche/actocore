/** SDK chat widget label fields editable per locale in Studio. */
export const SDK_LABEL_TEXT_FIELDS = [
  'headerTitle',
  'headerSubtitle',
  'emptyTitle',
  'emptyDescription',
  'actionsHint',
  'placeholder',
  'send',
  'stop',
  'newConversation',
  'minimize',
] as const;

export type SdkLabelTextField = (typeof SDK_LABEL_TEXT_FIELDS)[number];

export type SdkLabelTexts = Record<SdkLabelTextField, string>;

export const SDK_LABEL_TEXT_MAX_LENGTH: Record<SdkLabelTextField, number> = {
  headerTitle: 200,
  headerSubtitle: 400,
  emptyTitle: 200,
  emptyDescription: 600,
  actionsHint: 600,
  placeholder: 200,
  send: 80,
  stop: 80,
  newConversation: 80,
  minimize: 80,
};

export const SDK_LABEL_FIELD_TO_CHAT_KEY: Record<SdkLabelTextField, string> = {
  headerTitle: 'title',
  headerSubtitle: 'subtitle',
  emptyTitle: 'emptyTitle',
  emptyDescription: 'emptyDescription',
  actionsHint: 'actionsHint',
  placeholder: 'placeholder',
  send: 'send',
  stop: 'stop',
  newConversation: 'newConversation',
  minimize: 'minimize',
};

export interface TranslateSdkCopyResultData {
  translations: Record<string, Partial<SdkLabelTexts>>;
}
