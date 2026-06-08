/** Matches backend `assertValidStudioSeatUsername` / platform manager login names. */
const PLATFORM_USERNAME_RE = /^[a-z0-9][a-z0-9_-]{0,30}[a-z0-9]$|^[a-z0-9]{2}$/;

export function normalizePlatformUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidPlatformUsername(raw: string): boolean {
  const username = normalizePlatformUsername(raw);
  return PLATFORM_USERNAME_RE.test(username);
}
