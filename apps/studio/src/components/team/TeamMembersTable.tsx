import type { StudioMemberData } from '@ahmedrioueche/actocore-shared';
import { Pencil, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Table, type TableColumn } from '@/components/ui/Table';
import UserAvatar from '@/components/ui/UserAvatar';
import { useAuth } from '@/context/AuthContext';
import { useRemoveTeamMember } from '@/hooks/use-team';
import { canWriteTeam } from '@/lib/studio-permissions';
import {
  formatMemberProjectsLabel,
  isEditableTeamMember,
  memberLabel,
} from '@/lib/team';
import { useModalStore } from '@/stores/modal';
import { toast } from '@/stores/toast';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

interface TeamMembersTableProps {
  members: StudioMemberData[];
  isLoading: boolean;
}

export function TeamMembersTable({
  members,
  isLoading,
}: TeamMembersTableProps) {
  const { t } = useTranslation();
  const { session } = useAuth();
  const openConfirm = useModalStore((state) => state.openConfirm);
  const openModal = useModalStore((state) => state.openModal);
  const removeMember = useRemoveTeamMember();
  const canWrite = canWriteTeam(session);

  const columns = useMemo<TableColumn<StudioMemberData>[]>(() => {
    const baseColumns: TableColumn<StudioMemberData>[] = [
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
              {member.username ? (
                <p className="truncate text-xs text-text-secondary">
                  @{member.username}
                </p>
              ) : member.email ? (
                <p className="truncate text-xs text-text-secondary">
                  {member.email}
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
            {t(`roles.${member.role}`)}
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
            {formatMemberProjectsLabel(member, t)}
          </span>
        ),
        renderSkeleton: () => (
          <div className="mx-auto h-5 w-8 animate-pulse rounded bg-surface-hover" />
        ),
      },
    ];

    if (!canWrite) {
      return baseColumns;
    }

    baseColumns.push({
      key: 'actions',
      header: '',
      width: 'w-28',
      align: 'right',
      render: (member) => {
        if (!isEditableTeamMember(member)) {
          return null;
        }

        return (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() =>
                openModal('editMember', {
                  userId: member.userId,
                  username: member.username,
                  displayName: member.displayName,
                  projectIds: member.projectIds,
                })
              }
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
              aria-label={t('team.edit.title')}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                openConfirm({
                  title: t('team.remove.title'),
                  text: t('team.remove.confirm', {
                    name: memberLabel(member),
                  }),
                  confirmText: t('team.remove.submit'),
                  confirmVariant: 'danger',
                  onConfirm: () => {
                    void (async () => {
                      try {
                        await removeMember.mutateAsync(member.userId);
                        toast.success(t('team.remove.success'));
                      } catch (err) {
                        toast.error(getUnknownApiErrorMessage(t, err));
                      }
                    })();
                  },
                })
              }
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-danger-surface hover:text-danger"
              aria-label={t('team.remove.submit')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
      renderSkeleton: () => (
        <div className="ms-auto h-8 w-16 animate-pulse rounded-lg bg-surface-hover" />
      ),
    });

    return baseColumns;
  }, [canWrite, openConfirm, openModal, removeMember, t]);

  return (
    <Table
      columns={columns}
      data={members}
      keyExtractor={(member) => member.userId}
      isLoading={isLoading}
      renderMobileCard={(member) => (
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <UserAvatar name={memberLabel(member)} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-text-primary">
                {memberLabel(member)}
              </p>
              <p className="text-xs text-text-secondary">
                {t(`roles.${member.role}`)}
              </p>
            </div>
          </div>
        </div>
      )}
    />
  );
}
