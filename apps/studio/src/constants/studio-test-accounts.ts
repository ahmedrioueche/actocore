import { STUDIO_FEATURE_FLAGS } from '@ahmedrioueche/actocore-shared';

import { isStudioFeatureEnabled } from '@/lib/feature-flags';

export { STUDIO_TEST_ACCOUNTS } from '@ahmedrioueche/actocore-shared';
export type {
  StudioTestAccountDefinition,
  StudioTestAccountId,
} from '@ahmedrioueche/actocore-shared';

export function isStudioTestAccountsEnabled(): boolean {
  return isStudioFeatureEnabled(STUDIO_FEATURE_FLAGS.testAccounts);
}
