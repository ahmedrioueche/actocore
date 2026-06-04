import { BadRequestException } from '@nestjs/common';

export type UsageRange = {
  from?: Date;
  to?: Date;
};

const MAX_RANGE_MS = 366 * 24 * 60 * 60 * 1000;

export function parseUsageRangeQuery(
  fromRaw?: string,
  toRaw?: string,
): UsageRange {
  const from = fromRaw?.trim() ? parseIsoDate(fromRaw.trim(), 'from') : undefined;
  const to = toRaw?.trim() ? parseIsoDate(toRaw.trim(), 'to') : undefined;

  if (from && to && from > to) {
    throw new BadRequestException('from must be before to');
  }
  if (from && to && to.getTime() - from.getTime() > MAX_RANGE_MS) {
    throw new BadRequestException('Date range cannot exceed 366 days');
  }
  return { from, to };
}

export function defaultSeriesRange(): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  from.setUTCHours(0, 0, 0, 0);
  return { from, to };
}

function parseIsoDate(value: string, label: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Invalid ${label} date`);
  }
  return date;
}

export function buildCreatedAtFilter(range: UsageRange): Record<string, unknown> {
  if (!range.from && !range.to) {
    return {};
  }
  const createdAt: Record<string, Date> = {};
  if (range.from) {
    createdAt.$gte = range.from;
  }
  if (range.to) {
    createdAt.$lte = range.to;
  }
  return { createdAt };
}
