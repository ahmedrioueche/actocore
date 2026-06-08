import { CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PlanFormFields } from '@/components/admin/plans/PlanFormFields';
import {
  defaultPlanFormState,
  formStateToCreateDto,
  type PlanFormState,
} from '@/components/admin/plans/plan-form';
import BaseModal from '@/components/ui/BaseModal';
import { useCreatePlatformPlan } from '@/hooks/use-platform-plans';
import { useModalStore } from '@/stores/modal';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

export default function CreatePlanModal() {
  const { t } = useTranslation();
  const currentModal = useModalStore((state) => state.currentModal);
  const closeModal = useModalStore((state) => state.closeModal);
  const createPlan = useCreatePlatformPlan();

  const isOpen = currentModal === 'createPlan';
  const [form, setForm] = useState<PlanFormState>(defaultPlanFormState);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(defaultPlanFormState());
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.planId.trim()) {
      setError(t('admin.plans.errors.planIdRequired'));
      return;
    }
    if (!form.name.trim()) {
      setError(t('admin.plans.errors.nameRequired'));
      return;
    }

    setError(null);
    try {
      await createPlan.mutateAsync(formStateToCreateDto(form));
      closeModal();
    } catch (err) {
      setError(getUnknownApiErrorMessage(t, err));
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={t('admin.plans.createTitle')}
      subtitle={t('admin.plans.createSubtitle')}
      icon={CreditCard}
      maxWidth="max-w-2xl"
      primaryButton={{
        label: t('admin.plans.save'),
        type: 'submit',
        form: 'create-plan-form',
        loading: createPlan.isPending,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <form id="create-plan-form" onSubmit={(e) => void handleSubmit(e)}>
        <PlanFormFields
          form={form}
          onChange={setForm}
          mode="create"
          error={error}
        />
      </form>
    </BaseModal>
  );
}
