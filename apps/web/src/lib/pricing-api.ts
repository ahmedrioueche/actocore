import type { ApiResponse, StudioPlan } from '@ahmedrioueche/actocore-shared';

import { getActocoreApiUrl } from '@/lib/marketing-chat';

export async function fetchPublicPlans(): Promise<StudioPlan[]> {
  const base = getActocoreApiUrl();
  const res = await fetch(`${base}/v1/web/billing/plans`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  const text = await res.text();
  let json: ApiResponse<StudioPlan[]> & { message?: string };
  try {
    json = text ? JSON.parse(text) : { success: false, message: text };
  } catch {
    throw new Error(text || `Request failed (${res.status})`);
  }

  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message ?? `Request failed (${res.status})`);
  }

  return [...json.data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
