import { UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PlatformManagerFormFields } from '@/components/admin/team/PlatformManagerFormFields';
import {
  defaultPlatformManagerFormState,
  resolvePlatformManagerApiError,
  validatePlatformManagerForm,
  type PlatformManagerFieldErrors,
  type PlatformManagerFormState,
} from '@/components/admin/team/platform-manager-form';
import BaseModal from '@/components/ui/BaseModal';
import { useCreatePlatformManager } from '@/hooks/use-platform-auth';
import { useModalStore } from '@/stores/modal';
import { toast } from '@/stores/toast';
import { normalizePlatformUsername } from '@/utils/platform-username';

export default function CreatePlatformManagerModal() {
  const { t } = useTranslation();
  const currentModal = useModalStore((state) => state.currentModal);
  const closeModal = useModalStore((state) => state.closeModal);
  const createManager = useCreatePlatformManager();

  const isOpen = currentModal === 'createPlatformManager';
  const [form, setForm] = useState<PlatformManagerFormState>(
    defaultPlatformManagerFormState(),
  );
  const [fieldErrors, setFieldErrors] = useState<PlatformManagerFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(defaultPlatformManagerFormState());
      setFieldErrors({});
      setFormError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleFormChange = (next: PlatformManagerFormState) => {
    setForm(next);
    if (fieldErrors.username && next.username !== form.username) {
      setFieldErrors((current) => ({ ...current, username: undefined }));
    }
    if (fieldErrors.password && next.password !== form.password) {
      setFieldErrors((current) => ({ ...current, password: undefined }));
    }
    if (formError) {
      setFormError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validatePlatformManagerForm(form, t);
    setFieldErrors(validation.fieldErrors);
    setFormError(validation.formError ?? null);
    if (validation.formError || Object.keys(validation.fieldErrors).length > 0) {
      const validationMessage =
        validation.fieldErrors.username ??
        validation.fieldErrors.password ??
        validation.formError;
      if (validationMessage) {
        toast.error(validationMessage);
      }
      return;
    }

    setFieldErrors({});
    setFormError(null);
    try {
      await createManager.mutateAsync({
        username: normalizePlatformUsername(form.username),
        password: form.password,
        displayName: form.displayName.trim() || undefined,
        permissions: form.permissions,
      });
      toast.success(t('admin.team.createSuccess'));
      closeModal();
    } catch (err) {
      const resolved = resolvePlatformManagerApiError(err, t);
      toast.error(resolved.toastMessage);
      setFieldErrors(resolved.fieldErrors);
      setFormError(resolved.formError ?? null);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={t('admin.team.createTitle')}
      subtitle={t('admin.team.createSubtitle')}
      icon={UserPlus}
      maxWidth="max-w-2xl"
      primaryButton={{
        label: t('admin.team.save'),
        type: 'submit',
        form: 'create-platform-manager-form',
        loading: createManager.isPending,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <form
        id="create-platform-manager-form"
        onSubmit={(e) => void handleSubmit(e)}
      >
        <PlatformManagerFormFields
          form={form}
          onChange={handleFormChange}
          fieldErrors={fieldErrors}
          formError={formError}
        />
      </form>
    </BaseModal>
  );
}
