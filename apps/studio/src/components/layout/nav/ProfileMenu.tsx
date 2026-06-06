import { Link } from '@tanstack/react-router';
import { LogOut, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import Dropdown from '@/components/ui/Dropdown';
import UserAvatar from '@/components/ui/UserAvatar';
import { ThemeModeSelect } from '@/components/theme/ThemeModeSelect';
import { useAuth } from '@/context/AuthContext';

interface ProfileMenuProps {
  onLogout: () => void;
  logoutPending?: boolean;
}

export function ProfileMenu({ onLogout, logoutPending }: ProfileMenuProps) {
  const { t } = useTranslation();
  const { session } = useAuth();

  const displayName =
    session?.user.displayName ||
    session?.user.email ||
    session?.user.username ||
    t('nav.userFallback');

  return (
    <Dropdown
      align="right"
      mobileAsModal
      trigger={
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-transparent px-2 py-1.5 transition-colors hover:border-border hover:bg-surface-hover"
          aria-label={t('nav.accountMenu')}
        >
          <UserAvatar
            name={displayName}
            avatar={session?.user.picture}
            size="sm"
          />
          <span className="hidden max-w-[140px] truncate text-sm font-medium text-text-primary md:block">
            {displayName}
          </span>
        </button>
      }
    >
      {(close) => (
        <div className="min-w-[220px] p-2">
          <div className="mb-1 border-b border-border px-3 py-2">
            <p className="truncate font-semibold text-text-primary">
              {displayName}
            </p>
            {session?.account.name ? (
              <p className="truncate text-xs text-text-secondary">
                {session.account.name}
              </p>
            ) : null}
          </div>

          <Link
            to="/settings"
            onClick={close}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
          >
            <Settings className="h-4 w-4 text-text-secondary" />
            {t('nav.settings')}
          </Link>

          <div className="my-1 border-t border-border" />
          <ThemeModeSelect variant="inline" />

          <div className="my-1 border-t border-border" />
          <button
            type="button"
            disabled={logoutPending}
            onClick={() => {
              close();
              onLogout();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger-surface disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {t('auth.logout')}
          </button>
        </div>
      )}
    </Dropdown>
  );
}
