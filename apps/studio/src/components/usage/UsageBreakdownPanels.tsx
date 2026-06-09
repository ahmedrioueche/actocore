import { useTranslation } from 'react-i18next';

import { ActivityMeter } from '@/components/admin/analytics/ActivityMeter';
import { AnalyticsPanel } from '@/components/admin/analytics/AnalyticsPanel';
import { formatCompactNumber } from '@/components/admin/analytics/format-analytics';

function formatApiKeyLabel(label: string, t: (key: string) => string): string {
  if (label === 'Removed key') {
    return t('usage.apiKeyBreakdown.removedKey');
  }
  if (label === 'Unknown') {
    return t('usage.apiKeyBreakdown.unknownKey');
  }
  return label;
}

interface UsageBreakdownPanelsProps {
  intentEntries: [string, number][];
  modelEntries: [string, number][];
  apiKeyEntries: [string, number][];
  topIntentCount: number;
  topModelCount: number;
  topApiKeyCount: number;
  isLoading?: boolean;
}

export function UsageBreakdownPanels({
  intentEntries,
  modelEntries,
  apiKeyEntries,
  topIntentCount,
  topModelCount,
  topApiKeyCount,
  isLoading = false,
}: UsageBreakdownPanelsProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
      <AnalyticsPanel
        title={t('usage.intentBreakdown.title')}
        description={t('usage.intentBreakdown.description')}
      >
        {intentEntries.length === 0 && !isLoading ? (
          <p className="text-sm text-text-secondary">
            {t('usage.intentBreakdown.empty')}
          </p>
        ) : (
          <div className="space-y-4">
            {intentEntries.slice(0, 6).map(([intent, count]) => (
              <ActivityMeter
                key={intent}
                label={intent}
                value={count}
                max={Math.max(topIntentCount, 1)}
                formatValue={(value) =>
                  formatCompactNumber(value, i18n.language)
                }
                isLoading={isLoading}
              />
            ))}
          </div>
        )}
      </AnalyticsPanel>

      <AnalyticsPanel
        title={t('usage.modelBreakdown.title')}
        description={t('usage.modelBreakdown.description')}
      >
        {modelEntries.length === 0 && !isLoading ? (
          <p className="text-sm text-text-secondary">
            {t('usage.modelBreakdown.empty')}
          </p>
        ) : (
          <div className="space-y-4">
            {modelEntries.slice(0, 6).map(([model, count]) => (
              <ActivityMeter
                key={model}
                label={model}
                value={count}
                max={Math.max(topModelCount, 1)}
                formatValue={(value) =>
                  formatCompactNumber(value, i18n.language)
                }
                isLoading={isLoading}
                toneClassName="bg-gradient-to-r from-secondary to-primary"
              />
            ))}
          </div>
        )}
      </AnalyticsPanel>

      <AnalyticsPanel
        title={t('usage.apiKeyBreakdown.title')}
        description={t('usage.apiKeyBreakdown.description')}
      >
        {apiKeyEntries.length === 0 && !isLoading ? (
          <p className="text-sm text-text-secondary">
            {t('usage.apiKeyBreakdown.empty')}
          </p>
        ) : (
          <div className="space-y-4">
            {apiKeyEntries.slice(0, 6).map(([apiKeyLabel, count]) => (
              <ActivityMeter
                key={apiKeyLabel}
                label={formatApiKeyLabel(apiKeyLabel, t)}
                value={count}
                max={Math.max(topApiKeyCount, 1)}
                formatValue={(value) =>
                  formatCompactNumber(value, i18n.language)
                }
                isLoading={isLoading}
                toneClassName="bg-gradient-to-r from-primary to-accent"
              />
            ))}
          </div>
        )}
      </AnalyticsPanel>
    </div>
  );
}
