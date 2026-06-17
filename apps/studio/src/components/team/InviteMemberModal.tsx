import { UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ProjectAccessPicker } from '@/components/team/ProjectAccessPicker';
import BaseModal from '@/components/ui/BaseModal';
import InputField from '@/components/ui/InputField';
import Tip from '@/components/ui/Tip';
import { useAuth } from '@/context/AuthContext';
import { useProjectsList } from '@/hooks/use-projects';
import { useCreateTeamMember } from '@/hooks/use-team';
import { useModalStore } from '@/stores/modal';
import { toast } from '@/stores/toast';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

export default function InviteMemberModal() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const currentModal = useModalStore((state) => state.currentModal);
  const closeModal = useModalStore((state) => state.closeModal);

  const isOpen = currentModal === 'inviteMember';
  const createMember = useCreateTeamMember();
  const projectsQuery = useProjectsList();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [projectIds, setProjectIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setUsername('');
    setPassword('');
    setDisplayName('');
    const projects = projectsQuery.data ?? [];
    setProjectIds(projects.map((project) => project.id));
  }, [isOpen, projectsQuery.data]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      toast.error(t('team.invite.usernameRequired'));
      return;
    }
    if (password.length < 8) {
      toast.error(t('team.invite.passwordRequired'));
      return;
    }
    if (projectIds.length === 0) {
      toast.error(t('team.invite.projectsRequired'));
      return;
    }

    try {
      await createMember.mutateAsync({
        username: trimmedUsername,
        password,
        displayName: displayName.trim() || undefined,
        projectIds,
      });
      toast.success(t('team.invite.success'));
      closeModal();
    } catch (err) {
      toast.error(getUnknownApiErrorMessage(t, err));
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={t('team.invite.title')}
      subtitle={t('team.invite.subtitle')}
      icon={UserPlus}
      maxWidth="max-w-lg"
      primaryButton={{
        label: t('team.invite.submit'),
        type: 'submit',
        form: 'invite-member-form',
        loading: createMember.isPending,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <form
        id="invite-member-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
        {session?.account.id ? (
          <Tip title={t('team.invite.workspaceTitle')}>
            <p>{t('team.invite.workspaceHint')}</p>
            <p className="font-mono text-xs text-text-primary">
              {session.account.id}
            </p>
          </Tip>
        ) : null}

        <InputField
          label={t('team.fields.username')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t('team.fields.usernamePlaceholder')}
          autoFocus
        />
        <InputField
          label={t('team.fields.displayName')}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t('team.fields.displayNamePlaceholder')}
        />
        <InputField
          label={t('team.fields.password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('team.fields.passwordPlaceholder')}
        />

        <ProjectAccessPicker
          selectedIds={projectIds}
          onChange={setProjectIds}
        />
      </form>
    </BaseModal>
  );
}
