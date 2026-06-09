import { MetricCard } from '@/components/admin/analytics/MetricCard';
import type { UsageMetricDefinition } from '@/components/usage/use-usage-summary-metrics';

interface UsageMetricGridProps {
  metrics: UsageMetricDefinition[];
  isLoading?: boolean;
}

export function UsageMetricGrid({
  metrics,
  isLoading = false,
}: UsageMetricGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.key}
          label={metric.label}
          value={metric.value}
          hint={metric.hint}
          icon={metric.icon}
          tone={metric.tone}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
