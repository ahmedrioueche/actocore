import { useMemo, useState } from 'react';

export type UsageDateRangePreset = '7d' | '30d' | 'month';

export interface UsageDateRange {
  preset: UsageDateRangePreset;
  from: string;
  to: string;
}

function startOfUtcMonth(date: Date): Date {
  const start = new Date(date);
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function toIso(date: Date): string {
  return date.toISOString();
}

export function resolveUsageDateRange(preset: UsageDateRangePreset): UsageDateRange {
  const to = new Date();
  const from = new Date(to);

  if (preset === '7d') {
    from.setUTCDate(from.getUTCDate() - 6);
    from.setUTCHours(0, 0, 0, 0);
  } else if (preset === '30d') {
    from.setUTCDate(from.getUTCDate() - 29);
    from.setUTCHours(0, 0, 0, 0);
  } else {
    return {
      preset,
      from: toIso(startOfUtcMonth(to)),
      to: toIso(to),
    };
  }

  return {
    preset,
    from: toIso(from),
    to: toIso(to),
  };
}

export function useUsageDateRange(
  initialPreset: UsageDateRangePreset = '30d',
) {
  const [preset, setPreset] = useState<UsageDateRangePreset>(initialPreset);
  const range = useMemo(() => resolveUsageDateRange(preset), [preset]);

  return {
    preset,
    setPreset,
    from: range.from,
    to: range.to,
  };
}
