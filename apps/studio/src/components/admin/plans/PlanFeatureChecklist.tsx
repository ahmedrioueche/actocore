import {
  STUDIO_PLAN_FEATURE_IDS,
  type StudioPlanFeatureId,
} from '@ahmedrioueche/actocore-shared';
import { useTranslation } from 'react-i18next';

import Checkbox from '@/components/ui/Checkbox';

interface PlanFeatureChecklistProps {
  features: StudioPlanFeatureId[];
  onChange: (features: StudioPlanFeatureId[]) => void;
}

export function PlanFeatureChecklist({
  features,
  onChange,
}: PlanFeatureChecklistProps) {
  const { t } = useTranslation();

  const toggleFeature = (id: StudioPlanFeatureId, checked: boolean) => {
    if (checked) {
      onChange([...features, id]);
      return;
    }
    onChange(features.filter((featureId) => featureId !== id));
  };

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div>
        <p className="text-sm font-medium text-text-primary">
          {t('admin.plans.marketingFeatures')}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary">
          {t('admin.plans.marketingFeaturesHint')}
        </p>
      </div>

      <div className="space-y-2">
        {STUDIO_PLAN_FEATURE_IDS.map((id) => (
          <Checkbox
            key={id}
            id={`plan-feature-${id}`}
            checked={features.includes(id)}
            onChange={(checked) => toggleFeature(id, checked)}
            label={t(`subscription.plans.features.${id}`)}
          />
        ))}
      </div>
    </div>
  );
}
