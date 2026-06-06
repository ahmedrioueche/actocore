import type { StudioMemberData } from '@ahmedrioueche/actocore-shared';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/states';
import Error from '@/components/ui/Error';
import UserAvatar from '@/components/ui/UserAvatar';
import { Table, type TableColumn } from '@/components/ui/Table';
import { useTeamMembers } from '@/hooks/use-team';

function memberLabel(member: StudioMemberData): string {
  return (
    member.displayName ||
    member.email ||
    member.username ||
    member.userId
  );
}

export default function TeamPage() {
  const { t } = useTranslation();
  const membersQuery = useTeamMembers();
  const members = membersQuery.data ?? [];

  const columns: TableColumn<StudioMemberData>[] = [
    {
      key: 'member',
      header: t('team.columns.member'),
      render: (member) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={memberLabel(member)} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text-primary">
              {memberLabel(member)}
            </p>
            {member.email && member.username ? (
              <p className="truncate text-xs text-text-secondary">
                @{member.username}
              </p>
            ) : null}
          </div>
        </div>
      ),
      renderSkeleton: () => (
        <div className="h-10 w-40 animate-pulse rounded-lg bg-surface-hover" />
      ),
    },
    {
      key: 'role',
      header: t('team.columns.role'),
      width: 'w-32',
      render: (member) => (
        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {t(`roles.${member.role}`, { defaultValue: member.role })}
        </span>
      ),
      renderSkeleton: () => (
        <div className="h-6 w-16 animate-pulse rounded-full bg-surface-hover" />
      ),
    },
    {
      key: 'projects',
      header: t('team.columns.projects'),
      width: 'w-28',
      align: 'center',
      render: (member) => (
        <span className="text-sm text-text-secondary">
          {member.projectIds.length === 0
            ? t('team.allProjects')
            : member.projectIds.length}
        </span>
      ),
      renderSkeleton: () => (
        <div className="mx-auto h-5 w-8 animate-pulse rounded bg-surface-hover" />
      ),
    },
  ];

  const isEmpty =
    !membersQuery.isLoading &&
    !membersQuery.isError &&
    members.length === 0;

  return (
    <>
      <PageHeader
        title={t('team.title')}
        subtitle={
          membersQuery.isLoading
            ? undefined
            : t('team.subtitle', { count: members.length })
        }
      />

      {membersQuery.isError ? (
        <Error onRetry={() => void membersQuery.refetch()} />
      ) : isEmpty ? (
        <EmptyState
          icon={Users}
          title={t('team.emptyTitle')}
          description={t('team.emptyDescription')}
        />
      ) : (
        <Table
          columns={columns}
          data={members}
          keyExtractor={(member) => member.userId}
          isLoading={membersQuery.isLoading}
          renderMobileCard={(member) => (
            <div className="rounded-2xl bg-surface p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <UserAvatar name={memberLabel(member)} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text-primary">
                    {memberLabel(member)}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {t(`roles.${member.role}`, { defaultValue: member.role })}
                  </p>
                </div>
              </div>
            </div>
          )}
        />
      )}
    </>
  );
}
