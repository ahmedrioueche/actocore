import { useTranslation } from 'react-i18next';

import { isStudioTestAccountsEnabled } from '@/constants/studio-test-accounts';
import type { StudioAvailableTestAccountData } from '@ahmedrioueche/actocore-shared';
import { cn } from '@/utils/helper';

interface TestAccountPickerProps {
  account: StudioAvailableTestAccountData | null | undefined;
  loading?: boolean;
  loadingAvailability?: boolean;
  retryAfterSeconds?: number;
  selected?: boolean;
  onSelect: (account: StudioAvailableTestAccountData) => void;
  disabled?: boolean;
}

export function TestAccountPicker({
  account,
  loading = false,
  loadingAvailability = false,
  retryAfterSeconds,
  selected = false,
  onSelect,
  disabled = false,
}: TestAccountPickerProps) {
  const { t } = useTranslation();

  if (!isStudioTestAccountsEnabled()) {
    return null;
  }

  if (loadingAvailability) {
    return (
      <div className="space-y-3">
        <p className="text-center text-sm font-medium text-text-primary">
          {t('auth.testAccounts.useTestAccount')}
        </p>
        <div className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-sm text-text-secondary">
          {t('auth.testAccounts.loading')}
        </div>
      </div>
    );
  }

  if (!account) {
    const minutes =
      retryAfterSeconds != null
        ? Math.max(1, Math.ceil(retryAfterSeconds / 60))
        : undefined;

    return (
      <div className="space-y-3">
        <p className="text-center text-sm font-medium text-text-primary">
          {t('auth.testAccounts.useTestAccount')}
        </p>
        <div className="rounded-xl border border-border bg-surface px-4 py-4 text-center text-sm text-text-secondary">
          {minutes != null
            ? t('auth.testAccounts.noneAvailable', { minutes })
            : t('auth.testAccounts.noneAvailableGeneric')}
        </div>
      </div>
    );
  }

  const isBusy = loading && selected;

  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-medium text-text-primary">
        {t('auth.testAccounts.useTestAccount')}
      </p>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => onSelect(account)}
        className={cn(
          'w-full rounded-xl border border-primary bg-surface px-4 py-3 text-left transition-colors',
          'hover:bg-surface-secondary',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        <span className="block text-sm font-semibold text-text-primary">
          {account.displayName}
        </span>
        <span className="mt-0.5 block text-xs text-text-secondary">
          {account.accountName}
        </span>
        {isBusy ? (
          <span className="mt-2 block text-xs font-medium text-primary">
            {t('auth.testAccounts.signingIn')}
          </span>
        ) : selected ? (
          <span className="mt-2 block text-xs font-medium text-primary">
            {t('auth.testAccounts.selected')}
          </span>
        ) : null}
      </button>
    </div>
  );
}
