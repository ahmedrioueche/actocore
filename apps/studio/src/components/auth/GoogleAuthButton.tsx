import { useTranslation } from 'react-i18next';

import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { useGoogleAuth } from '@/hooks/use-auth';
import { cn } from '@/utils/helper';

interface GoogleAuthButtonProps {
  labelKey?: string;
}

export function GoogleAuthButton({ labelKey = 'auth.google' }: GoogleAuthButtonProps) {
  const { t } = useTranslation();
  const googleAuth = useGoogleAuth();

  return (
    <button
      type="button"
      disabled={googleAuth.isPending}
      onClick={() => googleAuth.mutate()}
      className={cn(
        'flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors duration-200',
        'hover:bg-surface-secondary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
      )}
    >
      {googleAuth.isPending ? (
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary"
          aria-hidden
        />
      ) : (
        <GoogleIcon />
      )}
      {t(labelKey)}
    </button>
  );
}
