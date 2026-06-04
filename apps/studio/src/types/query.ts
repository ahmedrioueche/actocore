import type { QueryKey } from '@tanstack/react-query';

/** Studio-only React Query metadata — never duplicate `packages/shared` API types. */
export interface StudioQueryMeta {
  errorToast?: boolean;
}

export type StudioQueryKey = QueryKey;
