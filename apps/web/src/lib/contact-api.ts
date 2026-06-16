import type { ApiResponse, ContactInquiryDto } from '@ahmedrioueche/actocore-shared';

import { getActocoreApiUrl } from '@/lib/marketing-chat';

export async function submitContactInquiry(
  payload: ContactInquiryDto,
): Promise<void> {
  const base = getActocoreApiUrl();
  const res = await fetch(`${base}/v1/web/contact`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: ApiResponse<{ sent: boolean }> & { message?: string };
  try {
    json = text ? JSON.parse(text) : { success: false, message: text };
  } catch {
    throw new Error(text || `Request failed (${res.status})`);
  }

  if (!res.ok || !json.success) {
    throw new Error(json.message ?? `Request failed (${res.status})`);
  }
}
