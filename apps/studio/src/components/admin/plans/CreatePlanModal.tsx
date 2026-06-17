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
import { toast } from '@/stores/toast';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

export default function CreatePlanModal() {
  const { t } = useTranslation();
  const currentModal = useModalStore((state) => state.currentModal);
  const closeModal = useModalStore((state) => state.closeModal);
  const createPlan = useCreatePlatformPlan();

  const isOpen = currentModal === 'createPlan';
  const [form, setForm] = useState<PlanFormState>(defaultPlanFormState);

  useEffect(() => {
    if (isOpen) {
      setForm(defaultPlanFormState());
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.planId.trim()) {
      toast.error(t('admin.plans.errors.planIdRequired'));
      return;
    }
    if (!form.name.trim()) {
      toast.error(t('admin.plans.errors.nameRequired'));
      return;
    }

    try {
      await createPlan.mutateAsync(formStateToCreateDto(form));
      closeModal();
    } catch (err) {
      toast.error(getUnknownApiErrorMessage(t, err));
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
        />
      </form>
    </BaseModal>
  );
}
