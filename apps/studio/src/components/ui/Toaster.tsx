import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useToastStore, type ToastVariant } from '@/stores/toast';
import { cn } from '@/utils/helper';

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-success/25 bg-success-surface text-text-primary',
  error: 'border-danger/25 bg-danger-surface text-text-primary',
  info: 'border-border bg-surface text-text-primary',
};

const VARIANT_ICONS: Record<
  ToastVariant,
  typeof CheckCircle2
> = {
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
  const { t } = useTranslation();
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

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
              'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg',
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
            <p className="min-w-0 flex-1 text-sm">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="shrink-0 rounded-lg p-1 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
              aria-label={t('common.dismiss')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
