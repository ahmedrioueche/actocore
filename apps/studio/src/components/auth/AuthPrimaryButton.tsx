import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/utils/helper';

interface AuthPrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
}

export function AuthPrimaryButton({
  children,
  loading,
  disabled,
  className,
  ...props
}: AuthPrimaryButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={cn(
        'auth-primary-button flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold shadow-md disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-primary-contrast/30 border-t-primary-contrast"
            aria-hidden
          />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
