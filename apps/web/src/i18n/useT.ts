import { useTranslation } from 'react-i18next';

/** Resolve keys under the `translation` namespace with an optional prefix. */
export function useT(keyPrefix?: string) {
  return useTranslation('translation', keyPrefix ? { keyPrefix } : undefined);
}
