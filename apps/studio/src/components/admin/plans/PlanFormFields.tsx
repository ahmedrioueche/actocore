import { useTranslation } from 'react-i18next';

import { PlanFormSection } from '@/components/admin/plans/PlanFormSection';
import { PlanMarketingFeatures } from '@/components/admin/plans/PlanMarketingFeatures';
import type { PlanFormState } from '@/components/admin/plans/plan-form';
import { PLAN_LEVEL_OPTIONS } from '@/components/admin/plans/plan-form';
import CustomSelect from '@/components/ui/CustomSelect';
import InputField from '@/components/ui/InputField';
import TextArea from '@/components/ui/TextArea';
import ToggleSwitch from '@/components/ui/ToggleSwitch';

interface PlanFormFieldsProps {
  form: PlanFormState;
  onChange: (form: PlanFormState) => void;
  mode: 'create' | 'edit';
  error?: string | null;
}

export function PlanFormFields({
  form,
  onChange,
  mode,
  error,
}: PlanFormFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <PlanFormSection
        title={t('admin.plans.detailsTitle')}
        subtitle={t('admin.plans.detailsSubtitle')}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label={t('admin.plans.planId')}
            value={form.planId}
            onChange={(e) => onChange({ ...form, planId: e.target.value })}
            disabled={mode === 'edit'}
            placeholder={t('admin.plans.planIdPlaceholder')}
          />
          <InputField
            label={t('admin.plans.name')}
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder={t('admin.plans.namePlaceholder')}
          />
          <CustomSelect
            title={t('admin.plans.level')}
            options={PLAN_LEVEL_OPTIONS}
            selectedOption={form.level}
            onChange={(level) =>
              onChange({
                ...form,
                level,
                ...(level === 'free'
                  ? { monthlyPrice: 0, yearlyPrice: 0 }
                  : {}),
              })
            }
            showIcon={false}
          />
          <InputField
            label={t('admin.plans.order')}
            type="number"
            min={0}
            value={String(form.order)}
            onChange={(e) =>
              onChange({ ...form, order: Number(e.target.value) })
            }
            placeholder={t('admin.plans.orderPlaceholder')}
          />
          <div className="md:col-span-2">
            <TextArea
              label={t('admin.plans.description')}
              value={form.description}
              onChange={(e) =>
                onChange({ ...form, description: e.target.value })
              }
              placeholder={t('admin.plans.descriptionPlaceholder')}
              rows={3}
            />
          </div>
        </div>
        <ToggleSwitch
          checked={form.isActive}
          onChange={(checked) => onChange({ ...form, isActive: checked })}
          label={t('admin.plans.active')}
        />
        <ToggleSwitch
          checked={form.isRecommended}
          onChange={(checked) => onChange({ ...form, isRecommended: checked })}
          label={t('admin.plans.isRecommended')}
        />
      </PlanFormSection>

      <PlanFormSection
        title={t('admin.plans.pricingTitle')}
        subtitle={t('admin.plans.pricingSubtitle')}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label={t('admin.plans.monthlyPrice')}
            type="number"
            min={0}
            value={String(form.monthlyPrice)}
            onChange={(e) =>
              onChange({ ...form, monthlyPrice: Number(e.target.value) })
            }
            placeholder={t('admin.plans.monthlyPricePlaceholder')}
            disabled={form.level === 'free'}
          />
          <InputField
            label={t('admin.plans.yearlyPrice')}
            type="number"
            min={0}
            value={String(form.yearlyPrice)}
            onChange={(e) =>
              onChange({ ...form, yearlyPrice: Number(e.target.value) })
            }
            placeholder={t('admin.plans.yearlyPricePlaceholder')}
            disabled={form.level === 'free'}
          />
          <div className="md:col-span-2">
            <InputField
              label={t('admin.plans.yearlyDiscountBadge')}
              value={form.yearlyDiscountBadge}
              onChange={(e) =>
                onChange({ ...form, yearlyDiscountBadge: e.target.value })
              }
              placeholder={t('admin.plans.yearlyDiscountBadgePlaceholder')}
              disabled={form.level === 'free'}
            />
            <p className="mt-1.5 text-xs text-text-secondary">
              {t('admin.plans.yearlyDiscountBadgeHint')}
            </p>
          </div>
        </div>
      </PlanFormSection>

      <PlanFormSection
        title={t('admin.plans.featuresTitle')}
        subtitle={t('admin.plans.featuresSubtitle')}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label={t('admin.plans.maxProjects')}
            type="number"
            min={0}
            value={String(form.maxProjects)}
            onChange={(e) =>
              onChange({ ...form, maxProjects: Number(e.target.value) })
            }
            placeholder={t('admin.plans.maxProjectsPlaceholder')}
          />
          <InputField
            label={t('admin.plans.maxTeamSeats')}
            type="number"
            min={0}
            value={String(form.maxTeamSeats)}
            onChange={(e) =>
              onChange({ ...form, maxTeamSeats: Number(e.target.value) })
            }
            placeholder={t('admin.plans.maxTeamSeatsPlaceholder')}
          />
          <InputField
            label={t('admin.plans.maxActionsPerProject')}
            type="number"
            min={0}
            value={String(form.maxActionsPerProject)}
            onChange={(e) =>
              onChange({
                ...form,
                maxActionsPerProject: Number(e.target.value),
              })
            }
            placeholder={t('admin.plans.maxActionsPerProjectPlaceholder')}
          />
          <div className="md:col-span-2">
            <InputField
              label={t('admin.plans.monthlyTokenQuota')}
              type="number"
              min={0}
              value={String(form.monthlyTokenQuota)}
              onChange={(e) =>
                onChange({ ...form, monthlyTokenQuota: Number(e.target.value) })
              }
              placeholder={t('admin.plans.monthlyTokenQuotaPlaceholder')}
            />
          </div>
        </div>

        <PlanMarketingFeatures
          features={form.features}
          onChange={(features) => onChange({ ...form, features })}
        />
      </PlanFormSection>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
