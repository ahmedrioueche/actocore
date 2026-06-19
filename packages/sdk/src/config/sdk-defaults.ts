/** Built-in SDK defaults for optional provider features. */
export const SDK_VOICE_DEFAULTS = {
  input: true,
  output: true,
  inputMode: 'auto' as const,
  autoSendOnFinalize: false,
};

export const SDK_LOADING_DEFAULTS = {
  initStyle: 'bar-and-centered' as const,
  thinkingStyle: 'text' as const,
  thinkingAnimation: 'ellipsis' as const,
};
