import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PlanFormFields } from '@/components/admin/plans/PlanFormFields';
import {
  formStateToUpdateDto,
  planToFormState,
  type PlanFormState,
} from '@/components/admin/plans/plan-form';
import BaseModal from '@/components/ui/BaseModal';
import { useUpdatePlatformPlan } from '@/hooks/use-platform-plans';
import { useModalStore, type EditPlanModalProps } from '@/stores/modal';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

export default function EditPlanModal() {
  const { t } = useTranslation();
  const currentModal = useModalStore((state) => state.currentModal);
  const modalProps = useModalStore((state) => state.modalProps);
  const closeModal = useModalStore((state) => state.closeModal);
  const updatePlan = useUpdatePlatformPlan();

  const isOpen = currentModal === 'editPlan';
  const props = modalProps as EditPlanModalProps | null;
  const plan = props?.plan;
  const planId = plan?.id;

  const [form, setForm] = useState<PlanFormState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && plan) {
      setForm(planToFormState(plan));
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, planId]);

  if (!isOpen || !plan || !form) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError(t('admin.plans.errors.nameRequired'));
      return;
    }

    setError(null);
    try {
      await updatePlan.mutateAsync({
        id: plan.id,
        body: formStateToUpdateDto(form),
      });
      closeModal();
    } catch (err) {
      setError(getUnknownApiErrorMessage(t, err));
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={t('admin.plans.editTitle')}
      subtitle={t('admin.plans.editSubtitle', { planId: plan.planId })}
      icon={Pencil}
      maxWidth="max-w-2xl"
      primaryButton={{
        label: t('admin.plans.saveChanges'),
        type: 'submit',
        form: 'edit-plan-form',
        loading: updatePlan.isPending,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <form id="edit-plan-form" onSubmit={(e) => void handleSubmit(e)}>
        <PlanFormFields
          form={form}
          onChange={setForm}
          mode="edit"
          error={error}
        />
      </form>
    </BaseModal>
  );
}
