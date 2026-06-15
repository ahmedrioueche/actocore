/** Normalize #RGB / #RRGGBB to #rrggbb. Returns null when empty or invalid. */
export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(trimmed);
  if (!match) {
    return null;
  }

  const hex = match[1];
  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toLowerCase();
  }

  return `#${hex.slice(0, 6).toLowerCase()}`;
}

export function isValidHexColor(value: string): boolean {
  if (!value.trim()) {
    return true;
  }
  return normalizeHexColor(value) !== null;
}
