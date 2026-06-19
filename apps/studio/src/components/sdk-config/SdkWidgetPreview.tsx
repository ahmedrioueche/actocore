import type { SdkConfigFormState } from '@/utils/sdk-config-form';
import { SDK_CONFIG_UI_TEXT_DEFAULTS } from '@/constants/sdk-config-defaults';
import { cn } from '@/utils/helper';

type SdkWidgetPreviewProps = {
  value: SdkConfigFormState;
};

function parseRem(value: string, fallbackRem: number): number {
  const trimmed = value.trim();
  const match = /^(\d+(?:\.\d+)?)rem$/.exec(trimmed);
  if (match) {
    return Number.parseFloat(match[1]);
  }
  if (/^\d+px$/.test(trimmed)) {
    return Number.parseInt(trimmed, 10) / 16;
  }
  return fallbackRem;
}

function resolvePreviewText(
  value: string,
  fallback: string,
): string {
  const trimmed = value.trim();
  return trimmed || fallback;
}

export function SdkWidgetPreview({ value }: SdkWidgetPreviewProps) {
  const panelLayout = value.panelLayout;
  const panelWidthRem = parseRem(value.panelWidth, 24);
  const isDockRight = panelLayout === 'dock-right';
  const isDockLeft = panelLayout === 'dock-left';
  const isOverlay = panelLayout === 'overlay';
  const launcherCorner = value.launcherPosition;
  const isHostLauncher = value.launcherPlacement === 'host';
  const isButtonVariant = value.launcherVariant === 'button';
  const isLinkVariant = value.launcherVariant === 'link';
  const headerTitle = resolvePreviewText(
    value.headerTitle,
    SDK_CONFIG_UI_TEXT_DEFAULTS.headerTitle,
  );
  const placeholder = resolvePreviewText(
    value.placeholder,
    SDK_CONFIG_UI_TEXT_DEFAULTS.placeholder,
  );
  const launcherLabel =
    value.launcherLabel.trim() ||
    value.launcherAriaLabel.trim() ||
    SDK_CONFIG_UI_TEXT_DEFAULTS.open;

  const launcherClass = cn(
    'absolute bg-primary shadow-md',
    !isHostLauncher && 'h-8 w-8 rounded-full',
    !isHostLauncher && launcherCorner === 'bottom-right' && 'bottom-3 right-3',
    !isHostLauncher && launcherCorner === 'bottom-left' && 'bottom-3 left-3',
    !isHostLauncher && launcherCorner === 'top-right' && 'top-3 right-3',
    !isHostLauncher && launcherCorner === 'top-left' && 'top-3 left-3',
    isHostLauncher &&
      isButtonVariant &&
      'right-3 top-3 flex h-7 items-center gap-1 rounded-full px-2.5 text-[10px] font-semibold text-white',
    isHostLauncher &&
      isLinkVariant &&
      'right-3 top-3 rounded px-1.5 py-0.5 text-[10px] font-semibold text-primary',
    isHostLauncher &&
      !isButtonVariant &&
      !isLinkVariant &&
      'right-3 top-3 h-7 w-7 rounded-full',
  );

  const panelClass = cn(
    'absolute flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg',
    isOverlay && 'bottom-14 right-3',
    isDockRight && 'bottom-0 right-0 top-0 rounded-none border-l',
    isDockLeft && 'bottom-0 left-0 top-0 rounded-none border-r',
  );

  const panelStyle = {
    width: `${Math.min(panelWidthRem, 20)}rem`,
  } as const;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="relative h-56 bg-gradient-to-br from-surface to-background">
        {isHostLauncher ? (
          <div className="absolute inset-x-0 top-0 flex h-10 items-center justify-between border-b border-border/80 bg-surface/90 px-3">
            <div className="h-2 w-16 rounded bg-border" />
            <div className={launcherClass} aria-hidden>
              {isButtonVariant || isLinkVariant ? launcherLabel : null}
            </div>
          </div>
        ) : null}

        <div className="absolute inset-4 rounded-lg border border-dashed border-border/80" />
        <div className="absolute left-6 top-14 h-2 w-24 rounded bg-border" />
        <div className="absolute left-6 top-[4.5rem] h-2 w-32 rounded bg-border/70" />

        <div className={panelClass} style={panelStyle}>
          <div className="truncate border-b border-border px-3 py-2 text-xs font-medium text-text-primary">
            {headerTitle}
          </div>
          <div className="flex-1 space-y-2 p-3">
            <div className="ml-auto max-w-[80%] rounded-lg bg-primary px-2 py-1 text-[10px] text-white">
              {placeholder}
            </div>
            <div className="max-w-[80%] rounded-lg border border-border bg-background px-2 py-1 text-[10px] text-text-secondary">
              How can I help?
            </div>
          </div>
        </div>

        {!isDockRight && !isDockLeft && !isHostLauncher ? (
          <div className={launcherClass} aria-hidden />
        ) : null}
      </div>
    </div>
  );
}
