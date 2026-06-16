import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

import { useT } from '@/i18n/useT';
import { cn } from '@/lib/utils';
import { dismissToast, useToasts, type ToastVariant } from '@/stores/toast';

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success:
    'border-toast-success-border bg-toast-success-bg shadow-md ring-1 ring-success/10',
  error:
    'border-toast-error-border bg-toast-error-bg shadow-md ring-1 ring-danger/10',
  info: 'border-toast-info-border bg-toast-info-bg shadow-md ring-1 ring-primary/10',
};

const VARIANT_ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const VARIANT_ICON_COLORS: Record<ToastVariant, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-primary',
};

export default function Toaster() {
  const { t } = useT('common');
  const toasts = useToasts();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((item) => {
        const Icon = VARIANT_ICONS[item.variant];
        return (
          <div
            key={item.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3',
              VARIANT_STYLES[item.variant],
            )}
            role="status"
          >
            <Icon
              className={cn(
                'mt-0.5 h-5 w-5 shrink-0',
                VARIANT_ICON_COLORS[item.variant],
              )}
              aria-hidden
            />
            <p className="min-w-0 flex-1 text-sm font-medium text-text-primary">
              {item.message}
            </p>
            <button
              type="button"
              onClick={() => dismissToast(item.id)}
              className="shrink-0 rounded-lg p-1 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
              aria-label={t('dismiss')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
