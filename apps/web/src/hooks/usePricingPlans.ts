import type { StudioPlan } from '@ahmedrioueche/actocore-shared';
import { useEffect, useState } from 'react';

import { fetchPublicPlans } from '@/lib/pricing-api';

type PricingPlansState = {
  plans: StudioPlan[];
  isLoading: boolean;
  error: string | null;
};

export function usePricingPlans(): PricingPlansState {
  const [plans, setPlans] = useState<StudioPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchPublicPlans();
        if (!cancelled) {
          setPlans(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load plans');
          setPlans([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { plans, isLoading, error };
}
