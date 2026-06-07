import { UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PlanLimitTip } from '@/components/billing/PlanLimitTip';
import { PageHeader } from '@/components/layout/PageHeader';
import { TeamMembersTable } from '@/components/team/TeamMembersTable';
import { AsyncContent } from '@/components/states';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useProjectsList } from '@/hooks/use-projects';
import { useSubscriptionSummary } from '@/hooks/use-subscription';
import { useTeamMembers } from '@/hooks/use-team';
import { isAtPlanLimit } from '@/lib/plan-limits';
import { canWriteTeam } from '@/lib/studio-permissions';
import { useModalStore } from '@/stores/modal';

export default function TeamPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const openModal = useModalStore((state) => state.openModal);
  const membersQuery = useTeamMembers();
  const summaryQuery = useSubscriptionSummary();
  const projectsQuery = useProjectsList();

  const members = membersQuery.data ?? [];
  const canWrite = canWriteTeam(session);
  const seatLimit = summaryQuery.data?.limits.maxTeamSeats;
  const seatsUsed = summaryQuery.data?.usage?.teamSeatsUsed ?? members.length;
  const atSeatLimit = isAtPlanLimit(seatsUsed, seatLimit);
  const hasProjects = (projectsQuery.data?.length ?? 0) > 0;

  return (
    <>
      <PageHeader
        title={t('team.title')}
        subtitle={
          membersQuery.isLoading
            ? undefined
            : t('team.subtitle', { count: members.length })
        }
        actions={
          canWrite ? (
            <Button
              icon={<UserPlus className="h-4 w-4" />}
              disabled={atSeatLimit || !hasProjects}
              onClick={() => openModal('inviteMember', {})}
            >
              {t('team.invite.button')}
            </Button>
          ) : undefined
        }
      />

      {atSeatLimit && seatLimit != null ? (
        <PlanLimitTip kind="seat" limit={seatLimit} className="mb-6" />
      ) : null}

      {!hasProjects && !projectsQuery.isLoading ? (
        <p className="mb-6 text-sm text-text-secondary">
          {t('team.projects.createFirst')}
        </p>
      ) : null}

      <AsyncContent
        isLoading={membersQuery.isLoading}
        isError={membersQuery.isError}
        isEmpty={!membersQuery.isLoading && !membersQuery.isError && members.length === 0}
        emptyTitle={t('team.emptyTitle')}
        emptyDescription={t('team.emptyDescription')}
        onRetry={() => void membersQuery.refetch()}
        loadingVariant="table"
      >
        <TeamMembersTable
          members={members}
          isLoading={membersQuery.isLoading}
        />
      </AsyncContent>
    </>
  );
}
