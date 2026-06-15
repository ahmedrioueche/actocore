/** i18next `returnObjects` may return a string key when not ready — normalize to string[]. */
export function asStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value.filter((item): item is string => typeof item === 'string');
  return items.length > 0 ? items : fallback;
}
