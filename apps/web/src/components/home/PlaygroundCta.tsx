import { CtaButton } from '@/components/site/CtaButton';
import { useT } from '@/i18n/useT';
import { playgroundPath } from '@/lib/site';

type PlaygroundCtaProps = {
  variant?: 'primary' | 'outline';
  className?: string;
};

export function PlaygroundCta({
  variant = 'primary',
  className,
}: PlaygroundCtaProps) {
  const { t } = useT('home');

  return (
    <CtaButton href={playgroundPath()} variant={variant} className={className}>
      {t('goToPlayground')}
    </CtaButton>
  );
}
