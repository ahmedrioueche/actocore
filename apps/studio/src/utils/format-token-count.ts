/** Compact display for token counts (e.g. 500000 → "500K", 5000000 → "5M"). */
export function formatTokenCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return '0';
  }
  if (value < 1_000) {
    return String(Math.round(value));
  }
  if (value < 1_000_000) {
    const thousands = value / 1_000;
    return `${stripTrailingZero(thousands)}K`;
  }
  const millions = value / 1_000_000;
  return `${stripTrailingZero(millions)}M`;
}

function stripTrailingZero(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
