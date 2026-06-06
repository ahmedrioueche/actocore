import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ElementType, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '@/components/ui/Button';
import { cn } from '@/utils/helper';

interface ActionButton {
  label: string;
  icon?: ElementType;
  onClick: () => void;
}

interface NoDataProps {
  icon?: LucideIcon;
  emoji?: string;
  title?: string;
  description?: string;
  actionButton?: ActionButton;
  footer?: ReactNode;
  className?: string;
  centered?: boolean;
}

const NoData = ({
  icon: Icon,
  emoji,
  title,
  description,
  actionButton,
  footer,
  className,
  centered = false,
}: NoDataProps) => {
  const { t } = useTranslation();

  const IconComponent = Icon || Inbox;
  const displayTitle = title || t('general.no_data');
  const displayDescription = description || t('general.no_data_desc');
  const ActionIcon = actionButton?.icon;

  const content = (
    <div
      className={cn(
        'empty-state relative w-full max-w-lg px-4 text-center md:px-6',
        !centered &&
          'rounded-3xl bg-gradient-to-b from-primary/[0.04] via-transparent to-secondary/[0.05] py-10 md:py-12',
        className,
      )}
    >
      <div
        className="empty-state__glow empty-state__glow--primary -top-10 left-1/2 h-36 w-36 -translate-x-1/2"
        aria-hidden
      />
      <div
        className="empty-state__glow empty-state__glow--secondary bottom-4 right-1/4 h-28 w-28"
        aria-hidden
      />

      <div className="empty-state__content relative z-10 flex flex-col items-center">
        <div className="empty-state__icon-wrap relative mb-8">
          {!emoji ? (
            <div className="empty-state__ring" aria-hidden />
          ) : null}

          <div
            className={cn(
              'relative flex items-center justify-center',
              emoji ? 'text-6xl md:text-7xl' : 'h-[5.5rem] w-[5.5rem] md:h-24 md:w-24',
            )}
          >
            {emoji ? (
              <span role="img" aria-hidden>
                {emoji}
              </span>
            ) : (
              <div className="empty-state__icon flex h-full w-full items-center justify-center rounded-[1.35rem] md:rounded-[1.5rem]">
                <IconComponent
                  className="h-9 w-9 text-primary-contrast md:h-10 md:w-10"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>
            )}
          </div>
        </div>

        <h3 className="mb-3 text-xl font-bold tracking-tight md:text-2xl">
          <span className="text-brand-gradient">{displayTitle}</span>
        </h3>

        <p className="mx-auto max-w-sm text-sm leading-relaxed text-text-secondary md:text-base">
          {displayDescription}
        </p>

        {actionButton ? (
          <div className="mt-8">
            <Button
              type="button"
              onClick={actionButton.onClick}
              icon={
                ActionIcon ? (
                  <ActionIcon className="h-4 w-4" strokeWidth={2.5} />
                ) : undefined
              }
            >
              {actionButton.label}
            </Button>
          </div>
        ) : null}

        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  );

  if (!centered) {
    return <div className="flex w-full justify-center">{content}</div>;
  }

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center py-8">
      {content}
    </div>
  );
};

export default NoData;
