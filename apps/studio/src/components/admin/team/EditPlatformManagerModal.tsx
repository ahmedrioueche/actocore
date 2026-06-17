import type { UpdatePlatformManagerDto } from '@ahmedrioueche/actocore-shared';
import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PlatformManagerFormFields } from '@/components/admin/team/PlatformManagerFormFields';
import {
  managerToFormState,
  resolvePlatformManagerApiError,
  validatePlatformManagerEditForm,
  type PlatformManagerFieldErrors,
  type PlatformManagerFormState,
} from '@/components/admin/team/platform-manager-form';
import BaseModal from '@/components/ui/BaseModal';
import { useUpdatePlatformManager } from '@/hooks/use-platform-auth';
import { useModalStore, type EditPlatformManagerModalProps } from '@/stores/modal';
import { toast } from '@/stores/toast';

export default function EditPlatformManagerModal() {
  const { t } = useTranslation();
  const currentModal = useModalStore((state) => state.currentModal);
  const modalProps = useModalStore((state) => state.modalProps);
  const closeModal = useModalStore((state) => state.closeModal);
  const updateManager = useUpdatePlatformManager();

  const isOpen = currentModal === 'editPlatformManager';
  const manager = (modalProps as EditPlatformManagerModalProps | null)?.manager;
  const managerId = manager?.userId;

  const [form, setForm] = useState<PlatformManagerFormState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<PlatformManagerFieldErrors>({});

  useEffect(() => {
    if (isOpen && manager) {
      setForm(managerToFormState(manager));
      setFieldErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, managerId]);

  if (!isOpen || !manager || !form) {
    return null;
  }

  const handleFormChange = (next: PlatformManagerFormState) => {
    setForm(next);
    if (fieldErrors.password && next.password !== form.password) {
      setFieldErrors((current) => ({ ...current, password: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validatePlatformManagerEditForm(form, t);
    setFieldErrors(validation.fieldErrors);
    if (validation.formError || Object.keys(validation.fieldErrors).length > 0) {
      const validationMessage =
        validation.fieldErrors.password ?? validation.formError;
      if (validationMessage) {
        toast.error(validationMessage);
      }
      return;
    }

    const body: UpdatePlatformManagerDto = {
      permissions: form.permissions,
    };

    const trimmedDisplayName = form.displayName.trim();
    if (trimmedDisplayName !== (manager.displayName ?? '')) {
      body.displayName = trimmedDisplayName;
    }
    if (form.password.length > 0) {
      body.password = form.password;
    }

    setFieldErrors({});
    try {
      await updateManager.mutateAsync({
        userId: manager.userId,
        body,
      });
      toast.success(t('admin.team.updateSuccess'));
      closeModal();
    } catch (err) {
      const resolved = resolvePlatformManagerApiError(err, t, 'update');
      toast.error(resolved.toastMessage);
      setFieldErrors(resolved.fieldErrors);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={t('admin.team.editTitle')}
      subtitle={t('admin.team.editSubtitle', { username: manager.username })}
      icon={Pencil}
      maxWidth="max-w-2xl"
      primaryButton={{
        label: t('admin.team.saveChanges'),
        type: 'submit',
        form: 'edit-platform-manager-form',
        loading: updateManager.isPending,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <form
        id="edit-platform-manager-form"
        onSubmit={(e) => void handleSubmit(e)}
      >
        <PlatformManagerFormFields
          form={form}
          onChange={handleFormChange}
          mode="edit"
          fieldErrors={fieldErrors}
        />
      </form>
    </BaseModal>
  );
}
