import { UserCog } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ProjectAccessPicker } from '@/components/team/ProjectAccessPicker';
import BaseModal from '@/components/ui/BaseModal';
import InputField from '@/components/ui/InputField';
import { useUpdateTeamMember } from '@/hooks/use-team';
import { useModalStore, type EditMemberModalProps } from '@/stores/modal';
import { toast } from '@/stores/toast';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

export default function EditMemberModal() {
  const { t } = useTranslation();
  const currentModal = useModalStore((state) => state.currentModal);
  const modalProps = useModalStore((state) => state.modalProps);
  const closeModal = useModalStore((state) => state.closeModal);

  const isOpen = currentModal === 'editMember';
  const member = (modalProps as EditMemberModalProps | null) ?? null;
  const updateMember = useUpdateTeamMember();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [projectIds, setProjectIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen || !member) {
      return;
    }
    setUsername(member.username ?? '');
    setDisplayName(member.displayName ?? '');
    setPassword('');
    setProjectIds(member.projectIds);
  }, [isOpen, member]);

  if (!isOpen || !member) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      toast.error(t('team.invite.usernameRequired'));
      return;
    }
    if (projectIds.length === 0) {
      toast.error(t('team.invite.projectsRequired'));
      return;
    }

    const body: {
      username?: string;
      displayName?: string;
      password?: string;
      projectIds: string[];
    } = {
      projectIds,
    };

    if (trimmedUsername !== member.username) {
      body.username = trimmedUsername;
    }
    const trimmedDisplayName = displayName.trim();
    if (trimmedDisplayName !== (member.displayName ?? '')) {
      body.displayName = trimmedDisplayName;
    }
    if (password.length > 0) {
      if (password.length < 8) {
        toast.error(t('team.invite.passwordRequired'));
        return;
      }
      body.password = password;
    }

    try {
      await updateMember.mutateAsync({
        userId: member.userId,
        body,
      });
      toast.success(t('team.edit.success'));
      closeModal();
    } catch (err) {
      toast.error(getUnknownApiErrorMessage(t, err));
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={t('team.edit.title')}
      subtitle={t('team.edit.subtitle')}
      icon={UserCog}
      maxWidth="max-w-lg"
      primaryButton={{
        label: t('team.edit.submit'),
        type: 'submit',
        form: 'edit-member-form',
        loading: updateMember.isPending,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <form
        id="edit-member-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
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
          label={t('team.fields.newPassword')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('team.fields.newPasswordPlaceholder')}
        />

        <ProjectAccessPicker
          selectedIds={projectIds}
          onChange={setProjectIds}
        />
      </form>
    </BaseModal>
  );
}
