import { Link } from '@tanstack/react-router';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import Tip from '@/components/ui/Tip';

type PlanLimitKind = 'project' | 'seat' | 'chat' | 'action';

interface PlanLimitTipProps {
  kind: PlanLimitKind;
  limit: number;
  className?: string;
  formatLimit?: (value: number) => string;
}

const MESSAGE_KEYS: Record<PlanLimitKind, string> = {
  project: 'planLimits.projectReached',
  seat: 'planLimits.seatReached',
  chat: 'planLimits.chatReached',
  action: 'planLimits.actionReached',
};

const TITLE_KEYS: Record<PlanLimitKind, string> = {
  project: 'planLimits.projectReachedTitle',
  seat: 'planLimits.seatReachedTitle',
  chat: 'planLimits.chatReachedTitle',
  action: 'planLimits.actionReachedTitle',
};

export function PlanLimitTip({
  kind,
  limit,
  className,
  formatLimit,
}: PlanLimitTipProps) {
  const { t } = useTranslation();
  const displayLimit =
    kind === 'chat' && formatLimit ? formatLimit(limit) : limit;

  return (
    <Tip
      variant="warning"
      icon={AlertTriangle}
      title={t(TITLE_KEYS[kind])}
      className={className}
    >
      <p>{t(MESSAGE_KEYS[kind], { limit: displayLimit })}</p>
      <Link
        to="/subscription"
        search={{ subscriptionId: undefined }}
        className="inline-block font-medium text-primary underline-offset-2 hover:underline"
      >
        {t('planLimits.upgradeLink')}
      </Link>
    </Tip>
  );
}
