import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import Button from '@/components/ui/Button';
import InputField from '@/components/ui/InputField';

interface PlanMarketingFeaturesProps {
  features: string[];
  onChange: (features: string[]) => void;
}

export function PlanMarketingFeatures({
  features,
  onChange,
}: PlanMarketingFeaturesProps) {
  const { t } = useTranslation();

  const updateAt = (index: number, value: string) => {
    const next = [...features];
    next[index] = value;
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(features.filter((_, itemIndex) => itemIndex !== index));
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

      {features.length === 0 ? (
        <p className="text-sm text-text-secondary">
          {t('admin.plans.noMarketingFeatures')}
        </p>
      ) : (
        <div className="space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <InputField
                value={feature}
                onChange={(e) => updateAt(index, e.target.value)}
                placeholder={t('admin.plans.featurePlaceholder')}
                className="min-w-0 flex-1"
              />
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="mt-0.5 shrink-0 rounded-lg p-2.5 text-text-secondary transition-colors hover:bg-danger-surface hover:text-danger"
                aria-label={t('admin.plans.removeFeature')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        color="primary"
        size="sm"
        icon={<Plus className="h-4 w-4" />}
        onClick={() => onChange([...features, ''])}
      >
        {t('admin.plans.addFeature')}
      </Button>
    </div>
  );
}
