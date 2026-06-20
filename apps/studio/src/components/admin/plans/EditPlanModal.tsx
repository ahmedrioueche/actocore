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
import {
  useSyncPlatformPlanPayPal,
  useUpdatePlatformPlan,
} from '@/hooks/use-platform-plans';
import { useFeatureModal } from '@/hooks/use-feature-modal';
import { useModalStore, type EditPlanModalProps  } from '@/stores/modal';
import { toast } from '@/stores/toast';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

export default function EditPlanModal() {
  const { t } = useTranslation();
  const { isOpen, props, closeModal } = useFeatureModal('editPlan');
  const updatePlan = useUpdatePlatformPlan();
  const syncPayPal = useSyncPlatformPlanPayPal();

  const plan = props?.plan;
  const planId = plan?.id;

  const [form, setForm] = useState<PlanFormState | null>(null);

  useEffect(() => {
    if (isOpen && plan) {
      setForm(planToFormState(plan));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, planId]);

  if (!isOpen || !plan || !form) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error(t('admin.plans.errors.nameRequired'));
      return;
    }

    try {
      await updatePlan.mutateAsync({
        id: plan.id,
        body: formStateToUpdateDto(form),
      });
      closeModal();
    } catch (err) {
      toast.error(getUnknownApiErrorMessage(t, err));
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
        />
        {plan.level !== 'free' ? (
          <div className="mt-4 border-t border-border pt-4">
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline disabled:opacity-60"
              disabled={syncPayPal.isPending}
              onClick={() => {
                void syncPayPal
                  .mutateAsync(plan.id)
                  .catch((err) =>
                    toast.error(getUnknownApiErrorMessage(t, err)),
                  );
              }}
            >
              {syncPayPal.isPending
                ? t('admin.plans.paypalSyncing')
                : t('admin.plans.paypalSyncNow')}
            </button>
          </div>
        ) : null}
      </form>
    </BaseModal>
  );
}
